import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { WorkOrderBoard } from './screens/WorkOrderBoard';
import { WorkOrderDetail } from './screens/WorkOrderDetail';
import { CustomerDirectory } from './screens/CustomerDirectory';
import { OmnichannelChat } from './screens/OmnichannelChat';
import { EscalateQueue } from './screens/EscalateQueue';
import { WorkshopOverview } from './screens/WorkshopOverview';
import { CustomerVehicleStatus } from './screens/CustomerVehicleStatus';
import { AIConfig } from './screens/AIConfig';
import type { WorkOrder } from './lib/types';

function App() {
  const [activeTab, setActiveTab] = useState('board');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

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
      default:
        return <WorkOrderBoard onSelectOrder={handleSelectOrder} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
