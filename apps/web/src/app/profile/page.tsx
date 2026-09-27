import { AuthGuard } from "@/shared/session/AuthGuard";
import { ProfileView } from "@/views/profile";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileView />
    </AuthGuard>
  );
}
