import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Clock, Save, AlertCircle } from 'lucide-react';
import * as api from '../lib/api';
import type { WorkOrder, WorkOrderStatus } from '../lib/types';
import { MOCK_ORDERS } from './WorkOrderBoard';

const STATUS_OPTIONS: WorkOrderStatus[] = ['Tiếp nhận', 'Đang sửa', 'Chờ giao xe', 'Đã hoàn thành'];
const STATUS_BADGE_MAP: Record<WorkOrderStatus, 'new' | 'progress' | 'wait' | 'done'> = {
  'Tiếp nhận': 'new',
  'Đang sửa': 'progress',
  'Chờ giao xe': 'wait',
  'Đã hoàn thành': 'done',
};

function formatCurrency(amount: number) {
  if (!amount) return '—';
  return amount.toLocaleString('vi-VN') + 'đ';
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function WorkOrderDetail({
  initialOrder,
  onBack,
}: {
  initialOrder: WorkOrder;
  onBack: () => void;
}) {
  const [order, setOrder] = useState<WorkOrder>(initialOrder);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus>('Tiếp nhận');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWorkOrderDetail(initialOrder.name);
      setOrder(data);
      setNotes(data.technical_notes ?? '');
      setSelectedStatus(data.status);
    } catch {
      console.warn('API error, using initial mock data');
      setOrder(initialOrder);
      setNotes(initialOrder.technical_notes ?? '');
      setSelectedStatus(initialOrder.status);
    } finally {
      setLoading(false);
    }
  }, [initialOrder]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await api.updateWorkOrderStatus(order.name, selectedStatus, notes);
      setOrder(updated);
      setNotes(updated.technical_notes ?? '');
      setSelectedStatus(updated.status);
    } catch {
      console.warn('Save API failed, simulating mock save');
      const mockUpdated = { ...order, status: selectedStatus, technical_notes: notes };
      setOrder(mockUpdated);
      
      // Update global mock list so the board sees it
      const idx = MOCK_ORDERS.findIndex(o => o.name === order.name);
      if (idx !== -1) MOCK_ORDERS[idx] = mockUpdated;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[var(--color-border)] border-t-[var(--color-brand-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
        <p className="text-[var(--color-text-secondary)]">{error ?? 'Không tìm thấy Work Order'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>← Quay lại</Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ChevronLeft size={18} /> Quay lại
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{order.license_plate}</h1>
          <p className="text-[var(--color-text-secondary)] mt-0.5">
            Work Order #{order.order_id} · Tạo lúc {formatDate(order.creation)}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_MAP[order.status]}>{order.status}</Badge>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cột trái: Thông tin xe & khách */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Phương tiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Biển số xe" value={order.license_plate} />
              <Row label="Hãng xe" value={order.car_brand ?? '—'} />
              <Row label="Dòng xe" value={order.car_model ?? '—'} />
              <Row label="Số KM" value={order.odometer ? `${order.odometer.toLocaleString('vi-VN')} km` : '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin Khách hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Tên" value={order.customer_name ?? '—'} />
              <Row label="Số điện thoại" value={order.customer_phone ?? '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu của Khách</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{order.customer_requests ?? 'Không có yêu cầu.'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng tiền quyết toán</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(order.total_amount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Kỹ thuật + trạng thái */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Ghi chú Kỹ thuật viên</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-40 resize-none border border-[var(--color-border)] rounded-md p-3 text-sm focus:outline-none focus:border-[var(--color-brand-primary)] bg-[var(--color-background)]"
                placeholder="Nhập ghi chú kỹ thuật, hiện tượng lỗi, phụ tùng đã thay..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cập nhật Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                      selectedStatus === s
                        ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-border-subtle)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={16} />
                Lịch sử Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Timeline tĩnh — sẽ nối với Frappe Document Version sau */}
                <TimelineItem time={formatDate(order.creation)} label="Tiếp nhận" active={true} />
                {order.status !== 'Tiếp nhận' && (
                  <TimelineItem time="—" label="Đang sửa" active={false} />
                )}
                {(order.status === 'Chờ giao xe' || order.status === 'Đã hoàn thành') && (
                  <TimelineItem time="—" label="Chờ giao xe" active={false} />
                )}
                {order.status === 'Đã hoàn thành' && (
                  <TimelineItem time={formatDate(order.modified)} label="Đã hoàn thành" active={false} done={true} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--color-text-secondary)] shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function TimelineItem({ time, label, active, done }: { time: string; label: string; active: boolean; done?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${done ? 'bg-[var(--color-status-done)]' : active ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-border)]'}`} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{time}</p>
      </div>
    </div>
  );
}
