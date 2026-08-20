import { Injectable } from '@nestjs/common';
import type { EmailJobPayload } from '../types/email-job.types';

@Injectable()
export class EmailFactory {
  build(payload: EmailJobPayload): { subject: string; html: string } {
    switch (payload.type) {
      case 'EMAIL_VERIFICATION':
        return {
          subject: 'Підтвердження email — Domly',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2>Вітаємо, ${payload.name}!</h2>
              <p>Будь ласка, підтвердьте свою електронну пошту, щоб отримати доступ до всіх можливостей платформи.</p>
              <a
                href="${payload.verificationUrl}"
                style="display: inline-block; padding: 12px 24px; background-color: #1a5c2a; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;"
              >
                Підтвердити email
              </a>
              <p style="color: #666; font-size: 12px;">
                Якщо ви не реєструвалися на Domly, просто проігноруйте цей лист.
              </p>
            </div>
          `,
        };
      case 'BOOKING_CREATED':
        return {
          subject: 'Нова бронь — Domly',
          html: `
             <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
               <h2>Вітаємо, ${payload.ownerName}!</h2>
               <p>Ваш об'єкт «${payload.propertyTitle}» щойно забронювали.</p>
               <p>Бронь утримує об'єкт протягом 24 годин. Якщо ви не домовитесь із покупцем/орендарем за цей час — бронь буде знято автоматично.</p>
               <p style="color: #666; font-size: 12px;">
                 ID броні: ${payload.bookingId}
               </p>
             </div>
           `,
        };
    }
  }
}
