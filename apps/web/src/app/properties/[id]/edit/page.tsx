import { AuthGuard } from "@/shared/session/AuthGuard";
import { EditPropertyView } from "@/views/edit-property";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AuthGuard>
      <EditPropertyView id={id} />
    </AuthGuard>
  );
}