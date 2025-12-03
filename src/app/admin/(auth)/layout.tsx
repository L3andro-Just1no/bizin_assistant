// Auth layout - no sidebar, just a simple wrapper for login/register pages
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

