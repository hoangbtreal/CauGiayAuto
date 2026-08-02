import React from 'react';
import { LayoutDashboard, Users, AlertCircle, Wrench, Menu, MessageSquare, Phone, Bot } from 'lucide-react';

export function Layout({ 
  children,
  activeTab,
  setActiveTab 
}: { 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      {/* Sidebar */}
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
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[var(--color-brand-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              Chi nhánh: Cơ sở 1 (Cầu Giấy)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold">Tài khoản Cố vấn</span>
              <span className="text-xs text-[var(--color-text-secondary)]">admin@caugiayauto.vn</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--color-border-subtle)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-text-secondary)]">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
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
