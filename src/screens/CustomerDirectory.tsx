import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Phone, Mail, MoreHorizontal, MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import * as api from '../lib/api';
import type { GaraCustomer } from '../lib/types';

// Mock data fallback
const MOCK_CUSTOMERS: GaraCustomer[] = [
  { name: 'CUST-001', customer_id: 'CUST-001', tenant_id: 'demo-gara-01', customer_name: 'Nguyễn Văn A', phone_number: '0901234567', email_address: 'nguyenvana@email.com', customer_tags: 'vip', marketing_opt_in: true },
  { name: 'CUST-002', customer_id: 'CUST-002', tenant_id: 'demo-gara-01', customer_name: 'Trần Thị B', phone_number: '0987654321', email_address: 'tranthib@email.com', marketing_opt_in: false },
  { name: 'CUST-003', customer_id: 'CUST-003', tenant_id: 'demo-gara-01', customer_name: 'Lê C', phone_number: '0912223334', customer_tags: 'xe_sang, kh_moi', marketing_opt_in: true },
  { name: 'CUST-004', customer_id: 'CUST-004', tenant_id: 'demo-gara-01', customer_name: 'Phạm D', phone_number: '0909998887', email_address: 'phamd@email.com', marketing_opt_in: false },
  { name: 'CUST-005', customer_id: 'CUST-005', tenant_id: 'demo-gara-01', customer_name: 'Hoàng E', phone_number: '0988777666', marketing_opt_in: true },
];

export function CustomerDirectory() {
  const [customers, setCustomers] = useState<GaraCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [useMock, setUseMock] = useState(false);

  const fetchCustomers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCustomers(query);
      setCustomers(data);
      setUseMock(false);
    } catch (e) {
      console.warn('[CustomerDirectory] API unavailable, using mock data:', e);
      setCustomers(
        MOCK_CUSTOMERS.filter(c => 
          c.customer_name.toLowerCase().includes(query.toLowerCase()) || 
          c.phone_number.includes(query)
        )
      );
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh bạ Khách hàng & Xe</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Quản lý thông tin khách hàng, liên hệ và lịch sử dịch vụ
            {useMock && (
              <span className="ml-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5">
                Demo Mode
              </span>
            )}
          </p>
        </div>
        <Button size="sm">+ Thêm Khách Hàng</Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, hoặc biển số xe..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter size={16} />
          Bộ lọc
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium">Khách hàng</th>
                <th className="px-6 py-4 font-medium">Liên hệ</th>
                <th className="px-6 py-4 font-medium">Phân loại</th>
                <th className="px-6 py-4 font-medium text-center">Marketing</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    <div className="w-6 h-6 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.name} className="hover:bg-[var(--color-background)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--color-text-primary)]">{customer.customer_name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{customer.customer_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[var(--color-text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Phone size={14} /> <span>{customer.phone_number}</span>
                        </div>
                        {customer.email_address && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} /> <span>{customer.email_address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {customer.customer_tags ? (
                          customer.customer_tags.split(',').map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag.trim().toUpperCase()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={customer.marketing_opt_in ? 'done' : 'wait'} className="text-xs">
                        {customer.marketing_opt_in ? 'Đồng ý' : 'Từ chối'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="w-8 h-8 p-0 flex items-center justify-center text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                          <MessageSquare size={16} />
                        </Button>
                        <Button variant="outline" size="sm" className="w-8 h-8 p-0 flex items-center justify-center">
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
