import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { EmailJobPayload } from './types/email-job.types';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('emails') private readonly emailsQueue: Queue<EmailJobPayload>,
  ) {}

  async queueEmail(payload: EmailJobPayload): Promise<void> {
    await this.emailsQueue.add(payload.type, payload);
  }
}
