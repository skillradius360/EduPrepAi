'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface DashboardClientShellProps {
  user: any;
  children: React.ReactNode;
}

export default function DashboardClientShell({ user, children }: DashboardClientShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar
        user={user}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex">
        <Sidebar role={user.role} isOpen={isSidebarOpen} />
        {children}
      </div>
    </div>
  );
}
