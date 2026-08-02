import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import * as api from '../lib/api';
import type { WorkshopSummary } from '../lib/types';

// Mock data fallback
const MOCK_REVENUE_DATA = [
  { name: 'T2', value: 12000000 },
  { name: 'T3', value: 19000000 },
  { name: 'T4', value: 15000000 },
  { name: 'T5', value: 22000000 },
  { name: 'T6', value: 28000000 },
  { name: 'T7', value: 35000000 },
  { name: 'CN', value: 42000000 },
];

const MOCK_CAR_DATA = [
  { name: 'T2', value: 4 },
  { name: 'T3', value: 7 },
  { name: 'T4', value: 5 },
  { name: 'T5', value: 8 },
  { name: 'T6', value: 10 },
  { name: 'T7', value: 15 },
  { name: 'CN', value: 18 },
];

function formatCurrency(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export function WorkshopOverview() {
  const [summary, setSummary] = useState<WorkshopSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWorkshopSummary();
      setSummary(data);
      setUseMock(false);
    } catch (e) {
      console.warn('[WorkshopOverview] API unavailable, using mock data:', e);
      setSummary({
        date: new Date().toISOString(),
        total_revenue: 42000000,
        total_orders: 18,
        orders_by_status: { 'Tiếp nhận': 2, 'Đang sửa': 8, 'Chờ giao xe': 4, 'Đã hoàn thành': 4 },
        daily_revenue: MOCK_REVENUE_DATA.map(d => ({ day: d.name, value: d.value })),
        daily_cars: MOCK_CAR_DATA.map(d => ({ day: d.name, value: d.value })),
      });
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[var(--color-border)] border-t-[var(--color-brand-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const revenueData = summary?.daily_revenue.length ? summary.daily_revenue.map(d => ({ name: d.day, value: d.value })) : MOCK_REVENUE_DATA;
  const carData = summary?.daily_cars.length ? summary.daily_cars.map(d => ({ name: d.day, value: d.value })) : MOCK_CAR_DATA;
  const pendingOrders = summary ? summary.orders_by_status['Đang sửa'] + summary.orders_by_status['Tiếp nhận'] + summary.orders_by_status['Chờ giao xe'] : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tổng quan Xưởng</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Báo cáo doanh thu và công suất phục vụ
            {useMock && (
              <span className="ml-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5">
                Demo Mode
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSummary} className="gap-1 shrink-0">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu quyết toán</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(summary?.total_revenue ?? 0)}</p>
            <p className="text-sm text-[var(--color-status-done)] mt-2">Dựa trên các lệnh đã hoàn thành</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tổng Work Order</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary?.total_orders ?? 0}</p>
            <p className="text-sm text-[var(--color-status-progress)] mt-2">Tất cả trạng thái</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Order Tồn đọng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{pendingOrders}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">Chưa hoàn thành</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Lượt xe vào xưởng</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={carData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="value" stroke="var(--color-status-wait)" strokeWidth={3} dot={{r: 4, fill: 'var(--color-status-wait)'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
