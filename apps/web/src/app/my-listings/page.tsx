import { AuthGuard } from "@/shared/session/AuthGuard";
import { MyListingsView } from "@/views/my-listings";

export default function MyListingsPage() {
  return (
    <AuthGuard>
      <MyListingsView />
    </AuthGuard>
  );
}
