import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import { EmailFactory } from '../factories/email.factory';
import type { EmailJobPayload } from '../types/email-job.types';

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(
    private readonly emailFactory: EmailFactory,
    configService: ConfigService,
  ) {
    super();

    const apiKey = configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn(
        'RESEND_API_KEY not set — emails will be logged, not sent',
      );
    }

    this.fromEmail =
      configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@domly.app';
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    const { subject, html } = this.emailFactory.build(job.data);

    if (!this.resend) {
      this.logger.warn(
        `[EMAIL SKIPPED] To: ${job.data.to}, Subject: ${subject}, Payload: ${JSON.stringify(job.data)}`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: job.data.to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${job.data.to}: ${subject}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${job.data.to}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
