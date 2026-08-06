import React, { useState } from 'react';
import { LayoutDashboard, Users, AlertCircle, Wrench, Menu, MessageSquare, Phone, Bot, CheckCircle, X, LogOut } from 'lucide-react';
import { logout } from '../../lib/api';

export function Layout({ 
  children,
  activeTab,
  setActiveTab,
  onLogout
}: { 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onLogout?.();
    }
  };

  const sidebar = (
    <aside className="w-64 bg-[var(--color-brand-surface)] border-r border-[var(--color-border)] flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2 text-[var(--color-brand-primary)] font-bold text-xl">
          <Wrench size={24} />
          <span>Cầu Giấy Auto</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          <NavItem icon={<LayoutDashboard size={20} />} label="Work Order Board" active={activeTab === 'board'} onClick={() => handleNavClick('board')} />
          <NavItem icon={<Users size={20} />} label="Khách hàng & Xe" active={activeTab === 'customers'} onClick={() => handleNavClick('customers')} />
          <NavItem icon={<MessageSquare size={20} />} label="CSKH & Chat (Zalo/FB)" active={activeTab === 'chat'} onClick={() => handleNavClick('chat')} />
          <NavItem icon={<AlertCircle size={20} />} label="Hàng chờ Escalate" active={activeTab === 'escalate'} onClick={() => handleNavClick('escalate')} />
          <NavItem icon={<Wrench size={20} />} label="Tổng quan xưởng" active={activeTab === 'overview'} onClick={() => handleNavClick('overview')} />
          
          <div className="mt-8 mb-2 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Hệ thống & Cấu hình
          </div>
          <NavItem icon={<Bot size={20} />} label="Cấu hình AI Agent" active={activeTab === 'ai-config'} onClick={() => handleNavClick('ai-config')} />
          <NavItem icon={<Phone size={20} />} label="Trạng thái xe (Demo)" active={activeTab === 'customer-status'} onClick={() => handleNavClick('customer-status')} />
          <NavItem icon={<CheckCircle size={20} />} label="Browser Test (VCM)" active={activeTab === 'browser-test'} onClick={() => handleNavClick('browser-test')} />
        </ul>
      </nav>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      {/* Sidebar - desktop */}
      <div className="hidden md:block shrink-0">
        {sidebar}
      </div>

      {/* Sidebar - mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-40 md:hidden shadow-xl">
            <div className="relative h-full">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-3 p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]"
                aria-label="Đóng menu"
              >
                <X size={20} />
              </button>
              {sidebar}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[var(--color-brand-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]"
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>
            <span className="font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 whitespace-nowrap text-xs sm:text-sm">
              Chi nhánh: Cơ sở 1 (Cầu Giấy)
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold">Tài khoản Cố vấn</span>
              <span className="text-xs text-[var(--color-text-secondary)]">admin@caugiayauto.vn</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--color-border-subtle)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-text-secondary)]">
              A
            </div>
            {onLogout && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active 
            ? 'bg-[var(--color-brand-primary)] text-white' 
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        {icon}
        {label}
      </button>
    </li>
  );
}
