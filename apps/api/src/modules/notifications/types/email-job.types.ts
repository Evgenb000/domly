export type EmailJobPayload = {
  type: 'EMAIL_VERIFICATION';
  to: string;
  name: string;
  verificationUrl: string;
};
