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
    }
  }
}
