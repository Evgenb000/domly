export type EmailJobPayload =
  | {
      type: 'EMAIL_VERIFICATION';
      to: string;
      name: string;
      verificationUrl: string;
    }
  | {
      type: 'BOOKING_CREATED';
      to: string;
      ownerName: string;
      propertyTitle: string;
      bookingId: string;
    };
