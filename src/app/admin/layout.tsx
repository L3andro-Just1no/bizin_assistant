// Base admin layout - just passes through children
// Specific layouts for (auth) and (dashboard) handle their own UI
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
