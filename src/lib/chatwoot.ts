// ==============================================================
// GARA CRM — Chatwoot Client (REST API + ActionCable realtime)
// Dùng để xây UI chat trực tiếp trong dashboard (không cần iframe).
// Docs API: https://www.chatwoot.com/developers/api/
// Websocket (ActionCable) nằm tại /cable?token=<pubsub_token>,
// subscribe kênh RoomChannel với room = account_id.
// ==============================================================

export type ChatwootConfig = {
  baseUrl: string;        // VD: http://localhost:3000
  accountId: string;      // VD: '1'
  apiToken: string;       // access_token dùng cho REST (header api_access_token)
  pubsubToken: string;    // dùng cho websocket
  agentName?: string;
};

export type ChatwootSender = {
  id?: number;
  name?: string;
  type?: string;          // 'Contact' | 'User' | 'AgentBot' ...
  avatar_url?: string;
};

export type ChatwootMessage = {
  id: number;
  content: string | null;
  content_type?: string;
  content_attributes?: Record<string, unknown>;
  message_type: number;   // 0=khách vào, 1=agent gửi, 2=template, 3=hoạt động hệ thống
  conversation_id: number;
  created_at: number;     // epoch seconds
  sender?: ChatwootSender;
};

export type ChatwootConversation = {
  id: number;
  status: 'open' | 'pending' | 'resolved' | 'snoozed';
  channel: string;
  unread_count: number;
  last_message_at?: number;
  last_activity_at: number;
  meta?: {
    sender?: ChatwootSender;
    contact?: { id: number; name?: string; phone_number?: string; email?: string };
    assignee?: ChatwootSender;
  };
  messages?: ChatwootMessage[];
  additional_attributes?: Record<string, unknown>;
};

export type ChatwootAuthResult = {
  accessToken: string;
  pubsubToken: string;
  accountId: string;
  accountName: string;
  agentName: string;
};

// --- Lưu cấu hình kết nối (localStorage) để không phải nhập lại mỗi lần ---
const CONFIG_KEY = 'gara-crm:chatwoot-config';

export function loadConfig(): ChatwootConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as ChatwootConfig;
    if (!cfg.baseUrl || !cfg.accountId || !cfg.apiToken) return null;
    return cfg;
  } catch {
    return null;
  }
}

export function saveConfig(cfg: ChatwootConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

// --- Đăng nhập tài khoản agent để lấy access_token + pubsub_token ---
export async function signIn(baseUrl: string, email: string, password: string): Promise<ChatwootAuthResult> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/sign_in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { message?: string }).message ?? (err as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const body = (await res.json()) as {
    data?: {
      access_token?: string;
      pubsub_token?: string;
      name?: string;
      accounts?: { id: number; name: string }[];
    };
  };
  const data = body.data;
  if (!data?.access_token) throw new Error('Không nhận được access_token từ Chatwoot');
  const account = (data.accounts ?? [])[0];
  if (!account) throw new Error('Tài khoản chưa được gắn vào workspace nào');
  return {
    accessToken: data.access_token,
    pubsubToken: data.pubsub_token ?? '',
    accountId: String(account.id),
    accountName: account.name,
    agentName: data.name ?? email,
  };
}

// --- Helper gọi REST API ---
async function chatwootRequest<T>(cfg: ChatwootConfig, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}${path}`, {
    headers: {
      'api_access_token': cfg.apiToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { message?: string }).message ?? (err as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// --- Danh sách hội thoại ---
export type ConversationFilter = {
  status?: 'open' | 'pending' | 'resolved' | 'all';
  assigneeType?: 'all' | 'unassigned' | 'me';
};

export async function getConversations(cfg: ChatwootConfig, filter: ConversationFilter = {}): Promise<ChatwootConversation[]> {
  const params = new URLSearchParams({ page: '1' });
  if (filter.status && filter.status !== 'all') params.set('status', filter.status);
  if (filter.assigneeType && filter.assigneeType !== 'all') params.set('assignee_type', filter.assigneeType);
  const body = await chatwootRequest<{ data: { payload: ChatwootConversation[] } }>(
    cfg,
    `/api/v1/accounts/${cfg.accountId}/conversations?${params.toString()}`
  );
  return body.data?.payload ?? [];
}

// --- Tin nhắn trong 1 hội thoại ---
export async function getMessages(cfg: ChatwootConfig, conversationId: number): Promise<ChatwootMessage[]> {
  const body = await chatwootRequest<{ data: { payload: ChatwootMessage[] } }>(
    cfg,
    `/api/v1/accounts/${cfg.accountId}/conversations/${conversationId}/messages`
  );
  return body.data?.payload ?? [];
}

// --- Gửi tin nhắn ---
export async function sendMessage(cfg: ChatwootConfig, conversationId: number, content: string): Promise<ChatwootMessage> {
  const body = await chatwootRequest<{ data: ChatwootMessage }>(
    cfg,
    `/api/v1/accounts/${cfg.accountId}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ message: { content } }),
    }
  );
  return body.data;
}

// --- Đổi trạng thái hội thoại (mở/đóng/xử lý) ---
export async function toggleStatus(cfg: ChatwootConfig, conversationId: number, status: ChatwootConversation['status']): Promise<void> {
  await chatwootRequest(
    cfg,
    `/api/v1/accounts/${cfg.accountId}/conversations/${conversationId}/toggle_status`,
    { method: 'POST', body: JSON.stringify({ status }) }
  );
}

// --- Gán agent ---
export async function assignConversation(cfg: ChatwootConfig, conversationId: number, agentId: number): Promise<void> {
  await chatwootRequest(
    cfg,
    `/api/v1/accounts/${cfg.accountId}/conversations/${conversationId}/assignments`,
    { method: 'POST', body: JSON.stringify({ assignee_id: agentId }) }
  );
}

// ==============================================================
// ActionCable (websocket) — realtime
// ==============================================================
export type RealtimeHandlers = {
  onMessageCreated?: (msg: ChatwootMessage) => void;
  onConversationUpdate?: (conv: Partial<ChatwootConversation>) => void;
  onConversationNew?: (conv: ChatwootConversation) => void;
  onStatusChange?: (connected: boolean) => void;
};

export function connectRealtime(cfg: ChatwootConfig, handlers: RealtimeHandlers): () => void {
  const wsBase = cfg.baseUrl.replace(/^http/, 'ws').replace(/\/$/, '');
  const ws = new WebSocket(`${wsBase}/cable?token=${encodeURIComponent(cfg.pubsubToken)}`);
  let closed = false;

  const send = (obj: unknown) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  };

  ws.onopen = () => {
    send({
      command: 'subscribe',
      identifier: JSON.stringify({ channel: 'RoomChannel', room: cfg.accountId }),
    });
    handlers.onStatusChange?.(true);
  };

  ws.onmessage = (ev) => {
    let frame: { type?: string; message?: { event?: string; data?: unknown } };
    try {
      frame = JSON.parse(String(ev.data));
    } catch {
      return;
    }
    if (!frame.type || frame.type === 'welcome' || frame.type === 'ping' || frame.type === 'confirm_subscription') return;
    if (frame.type === 'message' && frame.message) {
      const event = frame.message.event;
      const data = frame.message.data;
      if (event === 'message:created' && data) {
        handlers.onMessageCreated?.(data as ChatwootMessage);
      } else if (event === 'conversation:update' && data) {
        handlers.onConversationUpdate?.(data as Partial<ChatwootConversation>);
      } else if (event === 'conversation:new' && data) {
        handlers.onConversationNew?.(data as ChatwootConversation);
      }
    }
  };

  ws.onclose = () => {
    if (!closed) handlers.onStatusChange?.(false);
  };
  ws.onerror = () => {
    // onclose sẽ được gọi tiếp theo — để tránh onStatusChange(false) kép ở đây
  };

  return () => {
    closed = true;
    try {
      ws.close();
    } catch {
      /* noop */
    }
  };
}

// --- Helper hiển thị ---
export function channelLabel(channel: string): string {
  const c = channel.toLowerCase();
  if (c.includes('whatsapp')) return 'WhatsApp';
  if (c.includes('facebook')) return 'Facebook';
  if (c.includes('twilio_sms') || c.includes('sms')) return 'SMS';
  if (c.includes('email')) return 'Email';
  if (c.includes('web_widget') || c.includes('website')) return 'Website';
  if (c.includes('telegram')) return 'Telegram';
  return channel.replace(/^Channel::/, '');
}

export function formatTime(epochSeconds?: number): string {
  if (!epochSeconds) return '';
  const d = new Date(epochSeconds * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${time}`;
}

export function timeAgo(epochSeconds?: number): string {
  if (!epochSeconds) return '';
  const mins = Math.floor((Date.now() / 1000 - epochSeconds) / 60);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ`;
  return `${Math.floor(hrs / 24)} ngày`;
}
