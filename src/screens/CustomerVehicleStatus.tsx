import { CheckCircle, Wrench, Clock, Car } from 'lucide-react';
import type { WorkOrderStatus } from '../lib/types';

// Trang này dành cho Khách hàng — KHÔNG cần đăng nhập
// Truy cập qua: /status/:order_id hoặc link gửi qua Zalo/SMS
// Hiện dùng mock data; khi nối API thật: gọi endpoint public của ERPNext

const MOCK_ORDER = {
  order_id: 'WO-001',
  license_plate: '30F-123.45',
  car_brand: 'Toyota',
  car_model: 'Vios 2020',
  customer_name: 'Nguyễn Văn A',
  customer_requests: 'Bảo dưỡng cấp 4 (40.000km)',
  status: 'Đang sửa' as WorkOrderStatus,
  estimated_done: '15:00 hôm nay',
};

type StatusStep = {
  key: WorkOrderStatus;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const STEPS: StatusStep[] = [
  { key: 'Tiếp nhận', label: 'Đã tiếp nhận', icon: <Car size={20} />, description: 'Xe đã vào xưởng, Cố vấn dịch vụ đang kiểm tra và lập báo giá.' },
  { key: 'Đang sửa', label: 'Đang sửa chữa', icon: <Wrench size={20} />, description: 'Kỹ thuật viên đang thực hiện sửa chữa / bảo dưỡng.' },
  { key: 'Chờ giao xe', label: 'Chuẩn bị giao xe', icon: <Clock size={20} />, description: 'Xe đã hoàn thiện và đang được rửa, dọn dẹp nội thất.' },
  { key: 'Đã hoàn thành', label: 'Hoàn thành', icon: <CheckCircle size={20} />, description: 'Xe đã sẵn sàng để quý khách đến nhận.' },
];

const STATUS_ORDER: WorkOrderStatus[] = ['Tiếp nhận', 'Đang sửa', 'Chờ giao xe', 'Đã hoàn thành'];

import React from 'react';

export function CustomerVehicleStatus() {
  // TODO: đọc order_id từ URL params và gọi API public ERPNext
  const order = MOCK_ORDER;
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <h1 className="text-2xl font-bold">Trạng thái xe của bạn</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Cầu Giấy Auto — Dịch vụ ô tô uy tín</p>
      </div>

      {/* Thông tin xe */}
      <div className="w-full max-w-md bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Biển số xe</p>
            <p className="text-2xl font-bold mt-0.5">{order.license_plate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Phiếu sửa chữa</p>
            <p className="font-semibold mt-0.5">#{order.order_id}</p>
          </div>
        </div>
        <div className="border-t border-[var(--color-border-subtle)] pt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[var(--color-text-secondary)]">Xe</p>
            <p className="font-medium">{order.car_brand} {order.car_model}</p>
          </div>
          <div>
            <p className="text-[var(--color-text-secondary)]">Chủ xe</p>
            <p className="font-medium">{order.customer_name}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[var(--color-text-secondary)]">Nội dung</p>
            <p className="font-medium">{order.customer_requests}</p>
          </div>
          {order.estimated_done && (
            <div className="col-span-2">
              <p className="text-[var(--color-text-secondary)]">Dự kiến xong</p>
              <p className="font-medium text-[var(--color-status-done)]">{order.estimated_done}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline trạng thái */}
      <div className="w-full max-w-md bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="font-semibold mb-5">Tiến trình sửa chữa</h2>
        <div className="flex flex-col gap-0">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isPending = idx > currentIdx;

            return (
              <div key={step.key} className="flex gap-4">
                {/* Icon & connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isDone ? 'bg-[var(--color-status-done-bg)] text-[var(--color-status-done)]'
                    : isCurrent ? 'bg-[var(--color-brand-primary)] text-white'
                    : 'bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]'
                  }`}>
                    {step.icon}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 my-1 ${isDone ? 'bg-[var(--color-status-done)]' : 'bg-[var(--color-border)]'}`} />
                  )}
                </div>

                {/* Text */}
                <div className="pb-6 flex-1">
                  <p className={`font-semibold text-sm ${isPending ? 'text-[var(--color-text-muted)]' : ''}`}>
                    {step.label}
                    {isCurrent && <span className="ml-2 text-xs font-normal text-[var(--color-brand-primary)] animate-pulse">● Hiện tại</span>}
                  </p>
                  {(isDone || isCurrent) && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mt-8 text-center">
        Thông tin cập nhật tự động · Hỗ trợ: Gọi xưởng hoặc nhắn tin Zalo
      </p>
    </div>
  );
}
