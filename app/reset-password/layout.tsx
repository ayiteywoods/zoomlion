export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 z-50 overflow-y-auto">{children}</div>;
}
