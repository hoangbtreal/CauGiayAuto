// ==============================================================
// GARA CRM — API Client
// Gọi Frappe REST API tại ERPNext (localhost:8080)
// Docs: https://frappeframework.com/docs/user/en/api/rest
// ==============================================================

import type {
  WorkOrder,
  WorkOrderStatus,
  GaraCustomer,
  GaraVehicle,
  EscalateItem,
  WorkshopSummary,
  FrappeListResponse,
  FrappeDocResponse,
} from './types';
import { loadConfig } from './chatwoot';

// --- Cấu hình ---
const ERPNEXT_BASE = import.meta.env.VITE_ERPNEXT_URL ?? '/erpnext';
const ERPNEXT_FALLBACK_BASE = import.meta.env.VITE_ERPNEXT_FALLBACK_URL ?? 'http://localhost:8080';
const ENV_CHATWOOT_BASE = import.meta.env.VITE_CHATWOOT_URL ?? '/chatwoot';
const ENV_CHATWOOT_TOKEN = import.meta.env.VITE_CHATWOOT_API_TOKEN ?? '';
const ENV_CHATWOOT_ACCOUNT_ID = import.meta.env.VITE_CHATWOOT_ACCOUNT_ID ?? '1';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

// Ưu tiên config người dùng đã lưu (qua màn hình Cấu hình Chatwoot), fallback env
function chatwootEnv() {
  const cfg = loadConfig();
  return {
    base: cfg?.baseUrl ?? ENV_CHATWOOT_BASE,
    token: cfg?.apiToken ?? ENV_CHATWOOT_TOKEN,
    accountId: cfg?.accountId ?? ENV_CHATWOOT_ACCOUNT_ID,
  };
}

async function frappeRequest<T>(base: string, path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err._server_messages ?? err.exc ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function frappeFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await frappeRequest<T>(ERPNEXT_BASE, path, options);
  } catch (err) {
    if (!(err instanceof TypeError) || ERPNEXT_BASE !== '/erpnext') {
      throw err;
    }
    try {
      return await frappeRequest<T>(ERPNEXT_FALLBACK_BASE, path, options);
    } catch (fallbackErr) {
      throw new Error(
        fallbackErr instanceof TypeError
          ? `Không kết nối được ERPNext qua ${ERPNEXT_BASE} hoặc ${ERPNEXT_FALLBACK_BASE}. Hãy reload app và kiểm tra frontend đang chạy ở http://localhost:8443.`
          : fallbackErr instanceof Error ? fallbackErr.message : 'Không thể gọi ERPNext API'
      );
    }
  }
}

async function chatwootFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { base, token } = chatwootEnv();
  const res = await fetch(`${base}${path}`, {
    headers: {
      'api_access_token': token,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`Chatwoot HTTP ${res.status}`);
  return res.json();
}

// --- AUTH ---
export async function login(usr: string, pwd: string): Promise<void> {
  await frappeFetch('/api/method/login', {
    method: 'POST',
    body: JSON.stringify({ usr, pwd }),
  });
}

export async function logout(): Promise<void> {
  await frappeFetch('/api/method/logout', { method: 'GET' });
}

export async function getCurrentUser(): Promise<string> {
  const res = await frappeFetch<{ message: string }>('/api/method/auth');
  return res.message;
}

export async function checkSession(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== 'Guest';
  } catch {
    return false;
  }
}

// --- WORK ORDERS ---
export async function getWorkOrders(status?: WorkOrderStatus): Promise<WorkOrder[]> {
  const filters = status ? JSON.stringify([['status', '=', status]]) : '[]';
  const fields = JSON.stringify([
    'name', 'order_id', 'tenant_id', 'license_plate', 'status',
    'total_amount', 'customer_requests', 'creation', 'modified',
  ]);
  const res = await frappeFetch<FrappeListResponse<WorkOrder>>(
    `/api/resource/Gara Work Order?filters=${filters}&fields=${fields}&limit=100&order_by=creation desc`
  );
  return res.data;
}

export async function getWorkOrderDetail(name: string): Promise<WorkOrder> {
  const res = await frappeFetch<FrappeDocResponse<WorkOrder>>(
    `/api/resource/Gara Work Order/${encodeURIComponent(name)}`
  );
  return res.data;
}

export async function createWorkOrder(payload: Partial<WorkOrder>): Promise<WorkOrder> {
  const res = await frappeFetch<FrappeDocResponse<WorkOrder>>(
    '/api/resource/Gara Work Order',
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function updateWorkOrderStatus(
  name: string,
  status: WorkOrderStatus,
  technical_notes?: string
): Promise<WorkOrder> {
  const body: Partial<WorkOrder> = { status };
  if (technical_notes !== undefined) body.technical_notes = technical_notes;
  const res = await frappeFetch<FrappeDocResponse<WorkOrder>>(
    `/api/resource/Gara Work Order/${encodeURIComponent(name)}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return res.data;
}

export async function getWorkshopSummary(): Promise<WorkshopSummary> {
  const orders = await getWorkOrders();
  const byStatus: Record<string, number> = {
    'Tiếp nhận': 0, 'Đang sửa': 0, 'Chờ giao xe': 0, 'Đã hoàn thành': 0,
  };
  let totalRevenue = 0;
  orders.forEach(o => {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    if (o.status === 'Đã hoàn thành') totalRevenue += o.total_amount;
  });
  return {
    date: new Date().toISOString(),
    total_revenue: totalRevenue,
    total_orders: orders.length,
    orders_by_status: byStatus as WorkshopSummary['orders_by_status'],
    daily_revenue: [],
    daily_cars: [],
  };
}

// --- CUSTOMERS & VEHICLES ---
export async function getCustomers(search?: string): Promise<GaraCustomer[]> {
  const filters = search
    ? JSON.stringify([['customer_name', 'like', `%${search}%`]])
    : '[]';
  const fields = JSON.stringify([
    'name', 'customer_id', 'customer_name', 'phone_number',
    'email_address', 'occupation', 'customer_tags', 'marketing_opt_in',
  ]);
  const res = await frappeFetch<FrappeListResponse<GaraCustomer>>(
    `/api/resource/Gara Customer?filters=${filters}&fields=${fields}&limit=50`
  );
  return res.data;
}

export async function createCustomer(payload: Partial<GaraCustomer>): Promise<GaraCustomer> {
  const res = await frappeFetch<FrappeDocResponse<GaraCustomer>>(
    '/api/resource/Gara Customer',
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return res.data;
}

export async function searchVehicles(query: string): Promise<GaraVehicle[]> {
  const filters = JSON.stringify([['license_plate', 'like', `%${query}%`]]);
  const fields = JSON.stringify(['name', 'license_plate', 'car_brand', 'car_model', 'owner']);
  const res = await frappeFetch<FrappeListResponse<GaraVehicle>>(
    `/api/resource/Gara Vehicle?filters=${filters}&fields=${fields}&limit=20`
  );
  return res.data;
}

export async function createVehicle(payload: Partial<GaraVehicle>): Promise<GaraVehicle> {
  const res = await frappeFetch<FrappeDocResponse<GaraVehicle>>(
    '/api/resource/Gara Vehicle',
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return res.data;
}

// --- ESCALATE QUEUE (Chatwoot API) ---
export async function getEscalateQueue(): Promise<EscalateItem[]> {
  type CWConversation = {
    id: number;
    meta: { sender: { name: string } };
    channel: string;
    last_activity_at: number;
    labels: string[];
  };
  const data = await chatwootFetch<{ data: { payload: CWConversation[] } }>(
    `/api/v1/accounts/${chatwootEnv().accountId}/conversations?labels[]=ai_escalate&status=open`
  );
  return (data.data?.payload ?? []).map((conv) => ({
    id: String(conv.id),
    customer_name: conv.meta?.sender?.name ?? 'Khách hàng',
    channel: conv.channel ?? 'unknown',
    question_summary: '(Xem trong Chatwoot)',
    ai_reason: 'Flowise: Ngoài allowed_topics',
    waiting_since: new Date(conv.last_activity_at * 1000).toISOString(),
    chatwoot_conversation_id: conv.id,
  }));
}

export async function assignConversation(conversationId: number, agentId: number): Promise<void> {
  await chatwootFetch(
    `/api/v1/accounts/${chatwootEnv().accountId}/conversations/${conversationId}/assignments`,
    { method: 'POST', body: JSON.stringify({ assignee_id: agentId }) }
  );
}
