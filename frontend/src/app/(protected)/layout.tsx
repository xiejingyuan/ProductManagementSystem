import Navbar from "@/components/Navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full">
      <Navbar />
      <main className="flex-1 bg-zinc-50">{children}</main>
    </div>
  );
}
