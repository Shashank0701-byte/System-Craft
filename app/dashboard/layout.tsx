'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/SidebarContext";
import { useRequireAuth } from "@/src/hooks/useRequireAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex flex-1 w-full h-screen overflow-hidden bg-background-light dark:bg-[#060810]">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
