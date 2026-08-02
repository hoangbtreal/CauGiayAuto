// ==============================================================
// GARA CRM — TypeScript Types
// Khớp với schema ERPNext tại: gara-crm/schema/doctypes.json
// ==============================================================

export type WorkOrderStatus = 'Tiếp nhận' | 'Đang sửa' | 'Chờ giao xe' | 'Đã hoàn thành';

export type WorkOrder = {
  name: string;           // ERPNext primary key (auto)
  order_id: string;
  tenant_id: string;
  license_plate: string;
  odometer?: number;
  customer_requests?: string;
  technical_notes?: string;
  status: WorkOrderStatus;
  total_amount: number;
  created_by_user?: string;
  workflow_state?: string;
  creation?: string;      // ISO datetime — ERPNext auto field
  modified?: string;      // ISO datetime — ERPNext auto field
  // Joined fields (populated by API)
  customer_name?: string;
  customer_phone?: string;
  car_brand?: string;
  car_model?: string;
};

export type GaraCustomer = {
  name: string;
  customer_id: string;
  tenant_id: string;
  customer_name: string;
  phone_number: string;
  email_address?: string;
  social_id?: string;
  date_of_birth?: string;
  occupation?: string;
  customer_tags?: string;
  marketing_opt_in: boolean;
};

export type GaraVehicle = {
  name: string;
  license_plate: string;
  tenant_id: string;
  owner: string;          // Link → GaraCustomer.name
  car_brand?: string;
  car_model?: string;
  vin_number?: string;
  // Joined
  owner_name?: string;
  owner_phone?: string;
};

export type EscalateItem = {
  id: string;
  customer_name: string;
  channel: string;         // 'zalo' | 'facebook' | 'sms'
  question_summary: string;
  ai_reason: string;       // Lý do AI escalate
  waiting_since: string;   // ISO datetime
  chatwoot_conversation_id: number;
};

export type WorkshopSummary = {
  date: string;
  total_revenue: number;
  total_orders: number;
  orders_by_status: Record<WorkOrderStatus, number>;
  daily_revenue: { day: string; value: number }[];
  daily_cars: { day: string; value: number }[];
};

// Frappe API Response wrapper
export type FrappeListResponse<T> = {
  data: T[];
};

export type FrappeDocResponse<T> = {
  data: T;
};

export type FrappeError = {
  exc_type: string;
  exc: string;
  _server_messages?: string;
};
