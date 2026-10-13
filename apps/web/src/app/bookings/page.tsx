import { AuthGuard } from "@/shared/session/AuthGuard";
import { MyBookingsView } from "@/views/my-bookings";

export default function BookingsPage() {
  return (
    <AuthGuard>
      <MyBookingsView />
    </AuthGuard>
  );
}
