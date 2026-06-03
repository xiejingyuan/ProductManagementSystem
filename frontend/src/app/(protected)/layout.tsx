import Navbar from "@/components/Navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <main className="flex-1 bg-zinc-50">{children}</main>
    </div>
  );
}
