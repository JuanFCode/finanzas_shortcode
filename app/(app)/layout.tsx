import { Nav } from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
      <div className="hidden md:block md:pt-4">
        <Nav />
      </div>
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-10">{children}</main>
      <div className="md:hidden">
        <Nav />
      </div>
    </div>
  );
}
