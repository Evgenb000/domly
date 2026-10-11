# Спецификация статус-модели бронирования — Real Estate Marketplace

Читать перед реализацией модуля `bookings`. Эта спецификация закрывает конкретный вопрос:
подтверждение брони владельцем — это **не отдельное действие и не отдельный статус в БД**.
Модель максимально простая: бронь либо активна 24ч, либо её кто-то отменил вручную, либо она
истекла по таймеру.

## Сущности и статусы

### `Property.status`

```typescript
enum PropertyStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
}
```

Ровно два статуса. Никакого `PENDING_CONFIRMATION` или похожего — не добавлять.

### `Booking.status`

```typescript
enum BookingStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}
```

- `ACTIVE` — бронь только что создана, объект держится за юзером, таймер тикает
- `CANCELLED` — бронь отменена вручную (владельцем объекта, инициатором брони или ADMIN)
- `EXPIRED` — бронь истекла по таймеру, потому что за 24ч её никто не отменил

`CANCELLED` и `EXPIRED` — терминальные статусы, дальше с брони переходов нет.

## Переходы состояний

```
Property: AVAILABLE ──(создание брони)──> RESERVED ──(отмена ИЛИ истечение таймера)──> AVAILABLE

Booking:  (создание) ──> ACTIVE ──(ручная отмена)──> CANCELLED
                            │
                            └──(таймер сработал, отмены не было)──> EXPIRED
```

Важно: `CANCELLED` и `EXPIRED` с точки зрения `Property.status` делают одно и то же — возвращают
объект в `AVAILABLE`. Разница только в том, кто/что инициировало возврат — это нужно для истории
и для аналитики (воронка "брони: сколько отменено вручную vs сколько истекло само").

## Предусловия POST /bookings

Перед любой работой с транзакцией `BookingsService.create` проверяет три условия. Все три
проверяются **до** открытия транзакции: если хоть одна не пройдена — бронь не создаётся, событие
`booking.created` не эмитится, очередь email и BullMQ delayed job не трогаются.

1. **Гейт по подтверждённой почте.** Создание брони разрешено только при `emailVerified === true`.
   Иначе — `ForbiddenException` (403) с сообщением `Email must be verified to create a booking`.
   `emailVerified` читается из БД через `UsersRepository` (метод `UsersService.ensureEmailVerified`),
   а не из JWT payload: значение в токене может быть устаревшим. GRASP Information Expert — статус
   верификации знает `UsersService`, поэтому проверка живёт там, контроллер остаётся тонким.
2. **Владелец не может забронировать собственный объект.** Если `property.ownerId === userId` —
   `ForbiddenException` (403) с сообщением `You cannot book your own listing`.
3. **Объект должен существовать.** Если объекта с таким `propertyId` нет — `NotFoundException`
   (404) `Property not found`.

Порядок проверок в `BookingsService.create`:

```
(a) ensureEmailVerified(userId)                  -> 403, чтение объекта не выполняется
(b) findPropertyForBooking(propertyId) === null  -> 404
(c) property.ownerId === userId                  -> 403
(d) $transaction: UPDATE ... WHERE status = 'AVAILABLE', updatedCount === 0 -> 409
```

Из этого следует: 409 остаётся **только** за уже `RESERVED` (или удалённый между чтением и
`UPDATE`) объект — несуществующий `propertyId` теперь отдаёт 404, а не 409.

## Действия (API)

### `POST /bookings`

Вход: `propertyId`.

Предусловия (гейт `emailVerified`, запрет self-booking, существование объекта) — в разделе
«Предусловия POST /bookings» выше и выполняются раньше описанной ниже логики.

Логика (в `BookingsService`, Information Expert — именно этот сервис владеет правилами
бронирования):

1. Проверить, что `property.status === AVAILABLE`. Если нет — 409 Conflict, бронь не создаётся.
2. **Атомарно** (в рамках одной транзакции Prisma, `$transaction`) выполнить:
   - `UPDATE properties SET status = 'RESERVED' WHERE id = :id AND status = 'AVAILABLE'` —
     обязательно с условием `status = 'AVAILABLE'` в самом запросе, а не только в предварительной
     проверке на шаге 1. Это защита от race condition: если два юзера одновременно жмут
     "забронировать" на один и тот же объект, только один `UPDATE` реально применится
     (`updatedCount === 1`), второй должен получить 409, даже если оба прошли проверку на шаге 1
     до начала транзакции.
   - Создать `Booking { status: ACTIVE, propertyId, userId }`.
3. Заэмитить событие через `EventEmitter2` (например `booking.created`) — слушатели на это
   событие отправляют email владельцу объекта и, отдельно, планируют BullMQ delayed job.
4. Слушатель на `booking.created` ставит в очередь BullMQ delayed job с `delay: 24 * 60 * 60 * 1000`
   и payload `{ bookingId }`. **Сохранить `job.id` в `Booking.autoCancelJobId`** (добавить это
   поле в Prisma-схему) — понадобится для отмены джобы на шаге отмены брони ниже.

### `DELETE /bookings/:id` (отмена вручную)

Доступ: владелец объекта (`booking.property.ownerId === currentUser.id`), инициатор брони
(`booking.userId === currentUser.id`), или ADMIN. Guard проверяет это до вызова сервиса.

Логика:

1. Проверить, что `booking.status === ACTIVE`. Если уже `CANCELLED`/`EXPIRED` — 409 Conflict
   (бронь уже неактивна, отменять нечего).
2. Транзакция: `booking.status = CANCELLED`, `property.status = AVAILABLE`.
3. **Обязательно удалить/отменить связанную BullMQ delayed job** через сохранённый
   `autoCancelJobId` (`queue.getJob(id)` → `job.remove()`). Если этого не сделать — джоба всё равно
   сработает через 24ч и попытается что-то сделать с уже отменённой бронью (см. идемпотентность
   ниже — это подстрахует, но лишний тикающий джоб в очереди не нужен, лучше явно чистить).

### BullMQ processor (auto-cancel job)

Payload: `{ bookingId }`.

Логика — **обязательно идемпотентная**, потому что джоба может теоретически сработать после
отмены (если шаг 3 выше по какой-то причине не удалил джобу вовремя):

1. Загрузить `booking` по `bookingId`.
2. Если `booking.status !== ACTIVE` (то есть уже `CANCELLED`) — ничего не делать, выйти
   (`return`), это штатный случай, не ошибка.
3. Если `booking.status === ACTIVE` — транзакция: `booking.status = EXPIRED`,
   `property.status = AVAILABLE`.

## Что явно НЕ реализуется в v1

- Никакого действия/эндпоинта "подтвердить бронь" со стороны владельца
- Никакого статуса `Booking`/`Property`, кроме перечисленных выше трёх/двух
- Никакой переменной длительности таймера по типу сделки — `24h` фиксировано для продажи,
  долгосрочной и посуточной аренды одинаково в v1

## Паттерны, применяемые в этом модуле

- **GRASP Information Expert** — вся логика переходов статусов в `BookingsService`,
  `PropertiesService` не знает о бронированиях
- **Observer / Event Emitter** — `booking.created` → email владельцу + постановка джобы,
  развязывает основную бизнес-логику от побочных эффектов
- **Repository** — `BookingsRepository`/`PropertiesRepository` поверх Prisma, транзакция
  оборачивается на уровне сервиса, не репозитория
