import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'node:crypto';
import { TWENTY_FOUR_HOURS_MS } from '../../../common/constants/time.constants';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class UserRegisteredListener {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('user.registered')
  async handle(payload: { userId: string; email: string; name: string }) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);

    await this.authRepository.setEmailVerificationToken(
      payload.userId,
      token,
      expiresAt,
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    await this.notificationsService.queueEmail({
      type: 'EMAIL_VERIFICATION',
      to: payload.email,
      name: payload.name,
      verificationUrl,
    });
  }
}
