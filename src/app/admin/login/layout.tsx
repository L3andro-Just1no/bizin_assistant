// This layout overrides the parent admin layout for the login page
// It renders children without the AdminLayout wrapper
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Return just the children, bypassing the parent's AdminLayout
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
