interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {children}
    </main>
  );
}
