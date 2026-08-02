import React, { useState, useEffect, useCallback } from 'react';
import { Bot, User, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import * as api from '../lib/api';
import type { EscalateItem } from '../lib/types';

const MOCK_QUEUE: EscalateItem[] = [
  { id: '1', customer_name: 'Nguyễn Văn A', channel: 'zalo', question_summary: 'Xe em kêu cạch cạch ở gầm khi đánh lái, là bị sao ạ?', ai_reason: 'Flowise: Không xác định được nguyên nhân kỹ thuật', waiting_since: new Date(Date.now() - 1000 * 60 * 15).toISOString(), chatwoot_conversation_id: 101 },
  { id: '2', customer_name: 'Trần Thị B', channel: 'facebook', question_summary: 'Chi phí sơn lại toàn bộ xe Camry là bao nhiêu?', ai_reason: 'Flowise: Báo giá đồng sơn cần kiểm tra thực tế', waiting_since: new Date(Date.now() - 1000 * 60 * 45).toISOString(), chatwoot_conversation_id: 102 },
];

function timeAgo(isoString?: string) {
  if (!isoString) return '';
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 60) return `${mins} phút trước`;
  return `${Math.floor(mins / 60)} giờ trước`;
}

export function EscalateQueue() {
  const [queue, setQueue] = useState<EscalateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEscalateQueue();
      setQueue(data);
      setUseMock(false);
    } catch (e) {
      console.warn('[EscalateQueue] API unavailable, using mock data:', e);
      setQueue(MOCK_QUEUE);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleAssign = async (item: EscalateItem) => {
    setAssigningId(item.id);
    try {
      if (!useMock) {
        await api.assignConversation(item.chatwoot_conversation_id, 1);
        await fetchQueue();
      } else {
        setQueue(q => q.filter(x => x.id !== item.id));
      }
    } catch (e) {
      alert('Không thể nhận xử lý. Vui lòng kiểm tra kết nối Chatwoot.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
            <AlertCircle size={24} />
            Hàng chờ Escalate
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Các ca tư vấn phức tạp mà AI không thể tự trả lời, cần Cố vấn dịch vụ can thiệp
            {useMock && (
              <span className="ml-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5">
                Demo Mode
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} className="gap-1 shrink-0">
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

      <div className="flex-1 space-y-4">
        {loading && queue.length === 0 ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 rounded-lg bg-[var(--color-border-subtle)] animate-pulse" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)] bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl">
            <CheckCircle2 size={48} className="mb-4 text-green-500 opacity-50" />
            <p className="text-lg font-medium">Hàng chờ trống!</p>
            <p className="text-sm">Tất cả khách hàng đã được AI phục vụ tốt.</p>
          </div>
        ) : (
          queue.map(item => (
            <div key={item.id} className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-lg">{item.customer_name}</span>
                  <Badge variant="secondary" className="bg-white uppercase text-[10px]">
                    {item.channel}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-red-600 font-medium ml-auto md:ml-2">
                    <Clock size={12} />
                    Chờ {timeAgo(item.waiting_since)}
                  </span>
                </div>
                
                <div className="bg-white border border-red-100 rounded-md p-3 mb-3 relative">
                  <div className="absolute -left-3 top-3 w-6 h-6 bg-white border border-red-100 rounded-full flex items-center justify-center">
                    <User size={12} className="text-[var(--color-text-secondary)]" />
                  </div>
                  <p className="text-sm font-medium">{item.question_summary}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-100/50 p-2 rounded-md">
                  <Bot size={16} className="shrink-0" />
                  <span className="font-semibold">Lý do Escalate:</span>
                  <span>{item.ai_reason}</span>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-stretch justify-end md:justify-center gap-3 border-t md:border-t-0 md:border-l border-red-200 pt-4 md:pt-0 md:pl-5 shrink-0">
                <Button className="w-full gap-2 whitespace-nowrap" onClick={() => handleAssign(item)} disabled={assigningId === item.id}>
                  {assigningId === item.id ? 'Đang nhận...' : 'Nhận xử lý ngay'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
