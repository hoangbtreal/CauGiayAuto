import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Clock, MoreHorizontal, RefreshCw, AlertCircle } from 'lucide-react';
import * as api from '../lib/api';
import type { WorkOrder, WorkOrderStatus } from '../lib/types';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';

// --- Mock data dùng khi API chưa sẵn sàng ---
export const MOCK_ORDERS: WorkOrder[] = [
  { name: 'wo-001', order_id: 'WO-001', tenant_id: 'demo-gara-01', license_plate: '30F-123.45', status: 'Tiếp nhận', total_amount: 4500000, customer_requests: 'Bảo dưỡng cấp 4 (40.000km)', customer_name: 'Nguyễn Văn A', creation: new Date().toISOString() },
  { name: 'wo-002', order_id: 'WO-002', tenant_id: 'demo-gara-01', license_plate: '29A-999.99', status: 'Tiếp nhận', total_amount: 0, customer_requests: 'Sơn dặm cản trước', customer_name: 'Trần Thị B', creation: new Date().toISOString() },
  { name: 'wo-003', order_id: 'WO-003', tenant_id: 'demo-gara-01', license_plate: '51G-777.77', status: 'Đang sửa', total_amount: 12000000, customer_requests: 'Thay thước lái, rotuyn', technical_notes: 'Đang đợi phụ tùng tại cầu số 2', customer_name: 'Lê C', creation: new Date().toISOString() },
  { name: 'wo-004', order_id: 'WO-004', tenant_id: 'demo-gara-01', license_plate: '15A-111.22', status: 'Chờ giao xe', total_amount: 1500000, customer_requests: 'Rửa xe, dọn nội thất', customer_name: 'Phạm D', creation: new Date().toISOString() },
];

const STATUS_COLUMNS: { key: WorkOrderStatus; label: string; badge: 'new' | 'progress' | 'wait' | 'done' }[] = [
  { key: 'Tiếp nhận', label: 'TIẾP NHẬN', badge: 'new' },
  { key: 'Đang sửa', label: 'ĐANG SỬA', badge: 'progress' },
  { key: 'Chờ giao xe', label: 'CHỜ GIAO XE', badge: 'wait' },
  { key: 'Đã hoàn thành', label: 'ĐÃ HOÀN THÀNH', badge: 'done' },
];

function formatCurrency(amount: number) {
  if (!amount) return 'Chưa có';
  return amount.toLocaleString('vi-VN') + 'đ';
}

function timeAgo(isoString?: string) {
  if (!isoString) return '';
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export function WorkOrderBoard({ onSelectOrder }: { onSelectOrder?: (order: WorkOrder) => void }) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWorkOrders();
      setOrders(data);
      setUseMock(false);
    } catch (e) {
      // ERPNext chưa sẵn sàng — fallback sang mock data
      console.warn('[WorkOrderBoard] API unavailable, using mock data:', e);
      setOrders(MOCK_ORDERS);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh mỗi 30 giây
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const ordersByStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.key] = orders.filter(o => o.status === col.key);
    return acc;
  }, {} as Record<WorkOrderStatus, WorkOrder[]>);

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Order Board</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Quản lý tiến độ sửa chữa xe tại xưởng
            {useMock && (
              <span className="ml-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5">
                Demo Mode (chưa kết nối ERPNext)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>+ Tạo Work Order</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-170px)]">
        {STATUS_COLUMNS.map(col => (
          <div key={col.key} className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <h2 className="font-semibold text-sm">{col.label}</h2>
              <Badge variant={col.badge}>{ordersByStatus[col.key]?.length ?? 0}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {loading && orders.length === 0 ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-28 rounded-lg bg-[var(--color-border-subtle)] animate-pulse" />
                  ))}
                </div>
              ) : ordersByStatus[col.key]?.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-32 border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg">
                  <p className="text-sm text-[var(--color-text-muted)]">Không có</p>
                </div>
              ) : (
                ordersByStatus[col.key].map(order => (
                  <Card
                    key={order.name}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div>
                        <CardTitle>{order.license_plate}</CardTitle>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {order.customer_name ?? 'Khách hàng'}
                        </p>
                      </div>
                      <button
                        onClick={() => onSelectOrder?.(order)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm truncate">{order.customer_requests ?? '—'}</p>
                      {order.technical_notes && (
                        <p className="text-xs text-[var(--color-status-progress)] mt-1 font-medium truncate">
                          {order.technical_notes}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-3 text-xs text-[var(--color-text-secondary)]">
                        <Clock size={11} />
                        {timeAgo(order.creation)}
                      </div>
                    </CardContent>
                    <CardFooter className="py-2 flex items-center justify-between">
                      <span className={`text-sm font-medium ${!order.total_amount ? 'text-[var(--color-text-muted)]' : ''}`}>
                        {formatCurrency(order.total_amount)}
                      </span>
                      <Badge variant={col.badge} className="text-xs">
                        {order.status}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateWorkOrderModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newOrder) => {
            setShowCreateModal(false);
            if (useMock) {
              // Lưu vào MOCK_ORDERS để không bị mất khi setInterval refresh lại sau 30s
              MOCK_ORDERS.unshift(newOrder);
            }
            setOrders(prev => [newOrder, ...prev]);
          }}
        />
      )}
    </>
  );
}
