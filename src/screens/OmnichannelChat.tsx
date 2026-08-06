import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquareText, Settings, RefreshCw, Send, ShieldAlert, CheckCircle2,
  X, Clock, Wifi, WifiOff, Inbox, PlugZap, ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import * as cw from '../lib/chatwoot';
import type {
  ChatwootConfig, ChatwootConversation, ChatwootMessage,
} from '../lib/chatwoot';

// ---- Helper nhỏ ----
function senderName(conv: ChatwootConversation): string {
  return (
    conv.meta?.contact?.name ??
    conv.meta?.sender?.name ??
    `Hội thoại #${conv.id}`
  );
}

function conversationLastText(conv: ChatwootConversation): string {
  const last = (conv.messages ?? []).length
    ? conv.messages![conv.messages!.length - 1]
    : undefined;
  if (!last) return 'Chưa có tin nhắn';
  if (last.message_type === 3) return 'Hoạt động hệ thống';
  return last.content || '(đính kèm)';
}

function isOutgoing(msg: ChatwootMessage): boolean {
  return msg.message_type === 1 || (msg.sender?.type === 'User' || msg.sender?.type === 'AgentBot');
}

// ==============================================================
// Màn hình CSKH & Chat đa kênh — UI chat gốc, không cần iframe
// ==============================================================
export function OmnichannelChat() {
  const [config, setConfig] = useState<ChatwootConfig | null>(() => cw.loadConfig());
  const [connected, setConnected] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatwootMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'open' | 'all' | 'resolved'>('open');
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'unassigned'>('all');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const selectedIdRef = useRef<number | null>(null);
  selectedIdRef.current = selectedId;

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null;

  // ---- Tải danh sách hội thoại ----
  const loadConversations = useCallback(async (silent = false) => {
    if (!config) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const list = await cw.getConversations(config, {
        status: filterStatus === 'all' ? 'all' : filterStatus,
        assigneeType: filterAssignee,
      });
      setConversations(list);
      if (selectedIdRef.current == null && list.length > 0) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải danh sách hội thoại');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [config, filterStatus, filterAssignee]);

  // ---- Tải tin nhắn của hội thoại đang mở ----
  const loadMessages = useCallback(async (conversationId: number, silent = false) => {
    if (!config) return;
    try {
      const list = await cw.getMessages(config, conversationId);
      setMessages(list);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Không thể tải tin nhắn');
    }
  }, [config]);

  // Load ban đầu + khi thay đổi filter
  useEffect(() => {
    if (config) loadConversations();
    else setConversations([]);
  }, [config, loadConversations]);

  // Tải tin nhắn khi chọn hội thoại
  useEffect(() => {
    if (selectedId != null && config) loadMessages(selectedId);
    else setMessages([]);
  }, [selectedId, config, loadMessages]);

  // ---- Realtime (websocket) với fallback polling ----
  useEffect(() => {
    if (!config) return;
    const disconnect = cw.connectRealtime(config, {
      onStatusChange: setConnected,
      onMessageCreated: (msg) => {
        setMessages(prev =>
          prev.some(m => m.id === msg.id) ? prev : [...prev, msg],
        );
        loadConversations(true);
      },
      onConversationUpdate: () => loadConversations(true),
      onConversationNew: () => loadConversations(true),
    });
    return disconnect;
  }, [config, loadConversations]);

  useEffect(() => {
    if (!config || connected) return;
    const t = setInterval(() => {
      loadConversations(true);
      if (selectedIdRef.current != null) loadMessages(selectedIdRef.current, true);
    }, 15_000);
    return () => clearInterval(t);
  }, [config, connected, loadConversations, loadMessages]);

  // ---- Gửi tin nhắn ----
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !config || selectedId == null || sending) return;
    setSending(true);
    try {
      const msg = await cw.sendMessage(config, selectedId, text);
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
      setInputText('');
      loadConversations(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // ---- Đóng / mở lại hội thoại ----
  const handleToggleStatus = async () => {
    if (!config || selectedId == null) return;
    const next: ChatwootConversation['status'] = selectedConv?.status === 'resolved' ? 'open' : 'resolved';
    try {
      await cw.toggleStatus(config, selectedId, next);
      await loadConversations(true);
      if (selectedIdRef.current != null) await loadMessages(selectedIdRef.current, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể đổi trạng thái hội thoại');
    }
  };

  // ---- Modal cấu hình ----
  if (settingsOpen) {
    return (
      <ChatwootSettings
        initialConfig={config}
        onClose={() => setSettingsOpen(false)}
        onSave={(cfg) => {
          cw.saveConfig(cfg);
          setConfig(cfg);
          setSettingsOpen(false);
        }}
        onClear={() => {
          cw.clearConfig();
          setConfig(null);
          setConversations([]);
          setMessages([]);
          setSelectedId(null);
          setSettingsOpen(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquareText size={24} className="text-[var(--color-brand-primary)]" />
            CSKH & Chat Đa Kênh
          </h1>
          {config && (
            <ConnectionBadge connected={connected} />
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadConversations()} disabled={!config} className="gap-1 shrink-0">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-1 shrink-0">
            <Settings size={14} />
            Cấu hình
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
          <ShieldAlert size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {!config ? (
        <NotConnected onConfigure={() => setSettingsOpen(true)} />
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-brand-surface)]">
          {/* Cột trái: danh sách hội thoại */}
          <div className="border-b lg:border-b-0 lg:border-r border-[var(--color-border)] flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] flex flex-wrap items-center gap-1.5">
              {(['open', 'all', 'resolved'] as const).map(s => (
                <FilterChip key={s} active={filterStatus === s} label={s === 'open' ? 'Đang mở' : s === 'all' ? 'Tất cả' : 'Đã đóng'} onClick={() => setFilterStatus(s)} />
              ))}
              <button
                onClick={() => setFilterAssignee(f => f === 'unassigned' ? 'all' : 'unassigned')}
                className={`ml-auto text-xs px-2 py-1 rounded-md transition-colors ${
                  filterAssignee === 'unassigned'
                    ? 'bg-[var(--color-brand-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]'
                }`}
              >
                Chưa gán
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && conversations.length === 0 ? (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-[var(--color-border-subtle)] animate-pulse" />)}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)] gap-2">
                  <Inbox size={40} className="opacity-50" />
                  <p className="text-sm">Không có hội thoại nào trong bộ lọc này</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left px-3 py-3 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-border-subtle)] transition-colors ${
                      selectedId === conv.id ? 'bg-[var(--color-border-subtle)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate flex-1">{senderName(conv)}</span>
                      <Badge className="uppercase text-[10px]">{cw.channelLabel(conv.channel)}</Badge>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[var(--color-brand-primary)] text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] truncate mt-1">
                      {conversationLastText(conv)}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--color-text-muted)]">
                      <Clock size={10} />
                      {cw.timeAgo(conv.last_activity_at)}
                      {conv.meta?.assignee?.name && (
                        <span className="ml-auto truncate">Đã gán: {conv.meta.assignee.name}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cột phải: khung chat */}
          <div className="flex flex-col min-h-0">
            {selectedConv ? (
              <>
                <div className="px-4 py-2.5 border-b border-[var(--color-border-subtle)] flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-border-subtle)] border border-[var(--color-border)] flex items-center justify-center font-bold text-sm text-[var(--color-text-secondary)] shrink-0">
                    {senderName(selectedConv).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{senderName(selectedConv)}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {cw.channelLabel(selectedConv.channel)} · {selectedConv.status === 'resolved' ? 'Đã đóng' : 'Đang mở'}
                    </p>
                  </div>
                  <Button size="sm" variant={selectedConv.status === 'resolved' ? 'outline' : 'secondary'} onClick={handleToggleStatus}>
                    {selectedConv.status === 'resolved' ? 'Mở lại' : 'Đóng hội thoại'}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--color-background)]">
                  {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} outgoing={isOutgoing(msg)} />
                  ))}
                </div>

                <div className="px-3 py-2.5 border-t border-[var(--color-border-subtle)] flex gap-2 shrink-0">
                  <input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSend();
                    }}
                    placeholder="Nhập tin nhắn cho khách hàng..."
                    className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  />
                  <Button onClick={handleSend} disabled={sending || !inputText.trim()} className="gap-1 shrink-0">
                    <Send size={15} />
                    {sending ? 'Đang gửi' : 'Gửi'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-2">
                <Inbox size={44} className="opacity-50" />
                <p className="text-sm">Chọn một hội thoại ở bên trái để bắt đầu trả lời</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================
// Trạng thái kết nối realtime
// ==============================================================
function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      connected
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    }`}>
      {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
      {connected ? 'Trực tuyến (realtime)' : 'Đang tải theo chu kỳ'}
    </span>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
        active
          ? 'bg-[var(--color-brand-primary)] text-white'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]'
      }`}
    >
      {label}
    </button>
  );
}

// ==============================================================
// Bong bóng tin nhắn
// ==============================================================
function MessageBubble({ msg, outgoing }: { msg: ChatwootMessage; outgoing: boolean }) {
  if (msg.message_type === 3) {
    return (
      <div className="text-center text-[11px] text-[var(--color-text-muted)] py-1">
        {msg.content || 'Hoạt động hệ thống'}
      </div>
    );
  }
  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-xl px-3.5 py-2 text-sm break-words ${
        outgoing
          ? 'bg-[var(--color-brand-primary)] text-white rounded-br-sm'
          : 'bg-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-bl-sm'
      }`}>
        {msg.content || <span className="opacity-70">(đính kèm)</span>}
        <div className={`text-[10px] mt-1 ${outgoing ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
          {cw.formatTime(msg.created_at)}
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// Trạng thái chưa cấu hình
// ==============================================================
function NotConnected({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-240px)] border-2 border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-brand-surface)] p-8 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
        <MessageSquareText size={32} />
      </div>
      <h2 className="text-2xl font-bold mb-3">Kết nối Chatwoot</h2>
      <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
        Nhập thông tin tài khoản Chatwoot của xưởng (URL, tài khoản cố vấn dịch vụ) để
        trả lời khách hàng ngay trong hệ thống này — không cần mở Chatwoot ở tab riêng.
      </p>
      <div className="flex gap-3">
        <Button size="lg" onClick={onConfigure} className="gap-2">
          <PlugZap size={18} />
          Cấu hình kết nối
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => window.open(initialConfig?.baseUrl ?? '/chatwoot', '_blank')}
          className="gap-2"
        >
          Mở Chatwoot (tạm thời)
          <ExternalLink size={16} />
        </Button>
      </div>
    </div>
  );
}

// ==============================================================
// Modal cấu hình kết nối Chatwoot
// ==============================================================
function ChatwootSettings({
  initialConfig,
  onClose,
  onSave,
  onClear,
}: {
  initialConfig: ChatwootConfig | null;
  onClose: () => void;
  onSave: (cfg: ChatwootConfig) => void;
  onClear: () => void;
}) {
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl ?? '/chatwoot');
  const [accountId, setAccountId] = useState(initialConfig?.accountId ?? '1');
  const [mode, setMode] = useState<'signin' | 'token'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiToken, setApiToken] = useState(initialConfig?.apiToken ?? '');
  const [pubsubToken, setPubsubToken] = useState(initialConfig?.pubsubToken ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const r = await cw.signIn(baseUrl, email, password);
      setAccountId(r.accountId);
      setApiToken(r.accessToken);
      setPubsubToken(r.pubsubToken);
      setInfo(`Đăng nhập thành công: ${r.agentName} — workspace "${r.accountName}". Nhấn "Lưu & Kết nối" để bắt đầu.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng nhập thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    setError(null);
    if (!baseUrl.trim()) return setError('Vui lòng nhập URL Chatwoot');
    if (!accountId.trim()) return setError('Vui lòng nhập Account ID');
    if (!apiToken.trim()) return setError('Vui lòng nhập access token (đăng nhập hoặc dán token)');
    onSave({
      baseUrl: baseUrl.trim().replace(/\/$/, ''),
      accountId: accountId.trim(),
      apiToken: apiToken.trim(),
      pubsubToken: pubsubToken.trim(),
    });
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PlugZap size={24} className="text-[var(--color-brand-primary)]" />
          Cấu hình kết nối Chatwoot
        </h1>
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
          <X size={16} />
          Đóng
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 size={16} />
          {info}
        </div>
      )}

      <div className="space-y-6 bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">URL Chatwoot *</label>
          <input
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="http://localhost:3000 hoặc /chatwoot"
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Account ID *</label>
          <input
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
          />
        </div>

        {/* Chọn chế độ xác thực */}
        <div className="flex gap-2">
          <FilterChip active={mode === 'signin'} label="Đăng nhập tài khoản" onClick={() => setMode('signin')} />
          <FilterChip active={mode === 'token'} label="Dán access token" onClick={() => setMode('token')} />
        </div>

        {mode === 'signin' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email cố vấn dịch vụ</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="agent@caugiayauto.vn"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSignIn(); }}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={handleSignIn} disabled={busy || !email || !password} className="gap-1">
                {busy ? 'Đang đăng nhập...' : 'Đăng nhập & lấy token'}
              </Button>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Token chỉ được lưu trong phiên tab hiện tại và dùng để gọi API Chatwoot + kết nối realtime.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Access token (api_access_token)</label>
              <input
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                placeholder="Lấy từ màn hình Profile trong Chatwoot"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] text-sm font-mono focus:outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Pubsub token <span className="text-[var(--color-text-muted)]">(để realtime — tùy chọn)</span>
              </label>
              <input
                value={pubsubToken}
                onChange={e => setPubsubToken(e.target.value)}
                placeholder="Bỏ trống nếu không cần realtime"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] text-sm font-mono focus:outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {initialConfig ? (
          <Button variant="ghost" onClick={onClear} className="text-red-600 hover:bg-red-50">
            Ngắt kết nối & xóa cấu hình
          </Button>
        ) : <span />}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} className="gap-1">
            <CheckCircle2 size={16} />
            Lưu & Kết nối
          </Button>
        </div>
      </div>
    </div>
  );
}
