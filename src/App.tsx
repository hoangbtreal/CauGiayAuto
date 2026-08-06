import React, { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { checkSession } from './lib/api';
import { LoginScreen } from './screens/LoginScreen';
import { WorkOrderBoard } from './screens/WorkOrderBoard';
import { WorkOrderDetail } from './screens/WorkOrderDetail';
import { CustomerDirectory } from './screens/CustomerDirectory';
import { OmnichannelChat } from './screens/OmnichannelChat';
import { EscalateQueue } from './screens/EscalateQueue';
import { WorkshopOverview } from './screens/WorkshopOverview';
import { CustomerVehicleStatus } from './screens/CustomerVehicleStatus';
import { AIConfig } from './screens/AIConfig';
import { BrowserTestScreen } from './screens/BrowserTestScreen';
import type { WorkOrder } from './lib/types';

function App() {
  const [activeTab, setActiveTab] = useState('board');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    checkSession().then((ok) => {
      if (mounted) {
        setLoggedIn(ok);
        setAuthChecked(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text-secondary)]">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onLoggedIn={() => setLoggedIn(true)} />;
  }

  const handleSelectOrder = (order: WorkOrder) => {
    setSelectedOrder(order);
    setActiveTab('order-detail');
  };

  const handleBackFromDetail = () => {
    setSelectedOrder(null);
    setActiveTab('board');
  };

  // Trang Customer Status — standalone, không có Sidebar
  if (activeTab === 'customer-status') {
    return <CustomerVehicleStatus />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'board':
        return <WorkOrderBoard onSelectOrder={handleSelectOrder} />;
      case 'order-detail':
        return selectedOrder
          ? <WorkOrderDetail initialOrder={selectedOrder} onBack={handleBackFromDetail} />
          : <WorkOrderBoard onSelectOrder={handleSelectOrder} />;
      case 'customers':
        return <CustomerDirectory />;
      case 'chat':
        return <OmnichannelChat />;
      case 'escalate':
        return <EscalateQueue />;
      case 'overview':
        return <WorkshopOverview />;
      case 'ai-config':
        return <AIConfig />;
      case 'browser-test':
        return <BrowserTestScreen />;
      default:
        return <WorkOrderBoard onSelectOrder={handleSelectOrder} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setLoggedIn(false)}>
      {renderContent()}
    </Layout>
  );
}

export default App;
