import { PropertyFeed } from "@/widgets/property-feed/ui/PropertyFeed";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <main className="w-full max-w-6xl">
        <PropertyFeed />
      </main>
    </div>
  );
}
