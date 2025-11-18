export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dashboard pages are wrapped by the global NavShell in RootLayout.
  // This layout simply passes through children to avoid double nav.
  return <>{children}</>;
}

