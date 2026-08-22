import {
  BookingQuerySchema,
  CreateBookingSchema,
  type BookingQueryDto,
  type CreateBookingDto,
} from '@domly/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { CurrentUserPayload } from './bookings.service';
import { BookingsService } from './bookings.service';
import { BookingAccessGuard } from './guards/booking-access.guard';

@Controller('bookings')
@UseGuards(JwtAccessGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateBookingSchema)) dto: CreateBookingDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.bookingsService.create(dto.propertyId, currentUser.id);
  }

  @Get('my')
  async findMyBookings(
    @Query(new ZodValidationPipe(BookingQuerySchema)) query: BookingQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const { items, total } = await this.bookingsService.findManyForUser(
      currentUser.id,
      { status: query.status },
      query.page,
      query.limit,
    );
    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BookingAccessGuard)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.bookingsService.cancel(
      id,
      currentUser.id,
      currentUser.role === 'ADMIN',
    );
  }
}
