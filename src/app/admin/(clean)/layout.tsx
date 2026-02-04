export default function AdminCleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col items-center px-4 pt-16 pb-12">
      {children}
    </div>
  );
}
