import React, { useState } from 'react';
import { X, Car, User, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import * as api from '../lib/api';
import type { WorkOrder } from '../lib/types';

interface CreateWorkOrderModalProps {
  onClose: () => void;
  onCreated: (order: WorkOrder) => void;
}

export function CreateWorkOrderModal({ onClose, onCreated }: CreateWorkOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    license_plate: '',
    customer_name: '',
    customer_phone: '',
    customer_requests: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.license_plate || !formData.customer_name || !formData.customer_requests) {
      setError('Vui lòng nhập đầy đủ Biển số xe, Tên Khách hàng và Yêu cầu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const normalizedPlate = formData.license_plate.trim().toUpperCase();
      const customers = await api.getCustomers(formData.customer_name.trim());
      const customer = customers.find(c => c.customer_name === formData.customer_name.trim())
        ?? await api.createCustomer({
          tenant_id: 'demo-gara-01',
          customer_name: formData.customer_name.trim(),
          phone_number: formData.customer_phone.trim() || 'unknown',
        });
      const vehicles = await api.searchVehicles(normalizedPlate);
      const vehicle = vehicles.find(v => v.license_plate === normalizedPlate)
        ?? await api.createVehicle({
          tenant_id: 'demo-gara-01',
          license_plate: normalizedPlate,
          owner: customer.name,
        });
      const newOrder = await api.createWorkOrder({
        tenant_id: 'demo-gara-01',
        license_plate: vehicle.name,
        customer_requests: formData.customer_requests,
        status: 'Tiếp nhận',
        total_amount: 0,
      });
      onCreated(newOrder);
    } catch (err) {
      if (!api.isDemoMode()) {
        setError(err instanceof Error ? err.message : 'Không thể tạo Work Order');
        return;
      }
      console.warn('API error, using demo mock creation:', err);
      const mockOrder: WorkOrder = {
        name: `WO-NEW-${Date.now()}`,
        order_id: `WO-${Math.floor(Math.random() * 10000)}`,
        tenant_id: 'demo-gara-01',
        license_plate: formData.license_plate.trim().toUpperCase(),
        status: 'Tiếp nhận',
        total_amount: 0,
        customer_requests: formData.customer_requests,
        creation: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
      onCreated(mockOrder);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">Tạo lệnh sửa chữa mới</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
              <Car size={18} />
              Thông tin xe
            </h3>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Biển số xe *</label>
              <input
                type="text"
                placeholder="VD: 30F-123.45"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-brand-primary)] uppercase"
                value={formData.license_plate}
                onChange={e => handleChange('license_plate', e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-[var(--color-border-subtle)]">
            <h3 className="font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
              <User size={18} />
              Thông tin Khách hàng
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Tên khách hàng *</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-brand-primary)]"
                  value={formData.customer_name}
                  onChange={e => handleChange('customer_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="09..."
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-brand-primary)]"
                  value={formData.customer_phone}
                  onChange={e => handleChange('customer_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-[var(--color-border-subtle)]">
            <h3 className="font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
              <FileText size={18} />
              Nội dung dịch vụ
            </h3>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Yêu cầu của khách *</label>
              <textarea
                placeholder="Ghi chú các yêu cầu sửa chữa, bảo dưỡng từ khách hàng..."
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-brand-primary)] min-h-[100px]"
                value={formData.customer_requests}
                onChange={e => handleChange('customer_requests', e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3 bg-[var(--color-background)] rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo Work Order'}
          </Button>
        </div>
      </div>
    </div>
  );
}
