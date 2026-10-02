import { PropertyDetailsView } from "@/views/property-details";

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyDetailsView id={id} />;
}