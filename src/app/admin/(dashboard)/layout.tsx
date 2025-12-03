import { AdminLayout } from '@/components/admin/AdminLayout'

// Dashboard layout - includes the admin sidebar
// Auth is handled by middleware
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}

