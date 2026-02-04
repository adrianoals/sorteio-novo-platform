export default function AdminCleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col items-center p-4 py-8">
      {children}
    </div>
  );
}
