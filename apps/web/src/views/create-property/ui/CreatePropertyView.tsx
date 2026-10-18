import { CreatePropertyForm } from "@/features/create-property";
import { CREATE_PROPERTY_VIEW_STRINGS } from "../model/strings";

export function CreatePropertyView() {
  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">
        {CREATE_PROPERTY_VIEW_STRINGS.title}
      </h1>
      <CreatePropertyForm />
    </section>
  );
}