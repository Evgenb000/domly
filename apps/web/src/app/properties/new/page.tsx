import { AuthGuard } from "@/shared/session/AuthGuard";
import { CreatePropertyView } from "@/views/create-property";

export default function NewPropertyPage() {
  return (
    <AuthGuard>
      <CreatePropertyView />
    </AuthGuard>
  );
}