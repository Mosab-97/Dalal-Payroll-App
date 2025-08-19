import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-tesla-white">
      <Sidebar />
      <div className="ml-64">
        {children}
      </div>
    </div>
  );
}