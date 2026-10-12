import { AuthGuard } from "@/shared/session/AuthGuard";
import { FavoritesView } from "@/views/favorites";

export default function FavoritesPage() {
  return (
    <AuthGuard>
      <FavoritesView />
    </AuthGuard>
  );
}
