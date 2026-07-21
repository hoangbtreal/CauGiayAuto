import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'intake' | 'in_progress' | 'ready' | 'done'
type Role = 'service_advisor' | 'technician' | 'customer' | 'workshop_admin' | 'platform_operator'
type View =
  | 'board' | 'detail' | 'directory' | 'escalation'
  | 'overview' | 'ai_config' | 'staff' | 'care_campaigns'
  | 'my_orders' | 'customer_status' | 'platform'

interface WorkOrder {
  id: string; plate: string; customer: string; phone: string
  service: string; status: Status; total: number
  created: string; updated: string; assignedTo: string
  notes: string[]; vehicle: string; odometer: number
}
interface Customer {
  id: string; name: string; phone: string; email: string
  vehicles: string[]; totalOrders: number; lastVisit: string
}
interface EscalationItem {
  id: string; customer: string; question: string; channel: string
  waitMinutes: number; plate: string; aiConfidence: number
}
interface Tenant {
  id: string; name: string; city: string; plan: string
  ordersToday: number; revenueMonth: number; activeUsers: number
  aiStatus: 'healthy' | 'degraded' | 'down'; n8nFlows: number
  lastSync: string; openEscalations: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ORDERS: WorkOrder[] = [
  { id: 'WO-2407-001', plate: '51A-123.45', customer: 'Nguyễn Văn An', phone: '0901 234 567', service: 'Thay dầu máy + lọc dầu', status: 'intake', total: 850000, created: '07:42', updated: '08:05', assignedTo: 'Chưa giao', notes: ['Khách yêu cầu kiểm tra thêm phanh trước'], vehicle: 'Toyota Vios 2020', odometer: 45230 },
  { id: 'WO-2407-002', plate: '51G-456.78', customer: 'Trần Thị Bích', phone: '0912 345 678', service: 'Thay lốp 2 bánh trước', status: 'in_progress', total: 2400000, created: '08:15', updated: '09:20', assignedTo: 'Lê Hoàng Nam', notes: ['Đang tháo bánh', 'Cân bằng động sau khi lắp'], vehicle: 'Honda City 2022', odometer: 28100 },
  { id: 'WO-2407-003', plate: '59B-789.01', customer: 'Phạm Quốc Hùng', phone: '0933 456 789', service: 'Kiểm tra điều hòa + nạp gas', status: 'in_progress', total: 1200000, created: '08:50', updated: '10:10', assignedTo: 'Nguyễn Thế Anh', notes: ['Gas còn 30%', 'Phát hiện rò rỉ nhỏ ở van'], vehicle: 'Mazda CX-5 2019', odometer: 67800 },
  { id: 'WO-2407-004', plate: '51K-234.56', customer: 'Lê Thị Hoa', phone: '0945 567 890', service: 'Thay má phanh 4 bánh', status: 'ready', total: 3600000, created: '07:00', updated: '11:30', assignedTo: 'Trần Minh Đức', notes: ['Hoàn thành', 'Đã test thử trên sân'], vehicle: 'Hyundai Santa Fe 2021', odometer: 52000 },
  { id: 'WO-2407-005', plate: '51F-567.89', customer: 'Vũ Minh Tuấn', phone: '0967 678 901', service: 'Bảo dưỡng định kỳ 30.000km', status: 'ready', total: 4200000, created: '06:30', updated: '10:45', assignedTo: 'Lê Hoàng Nam', notes: ['Thay dầu, lọc khí, nước làm mát', 'Đã kiểm tra toàn bộ'], vehicle: 'Kia Seltos 2023', odometer: 30015 },
  { id: 'WO-2407-006', plate: '51A-890.12', customer: 'Đỗ Thanh Hà', phone: '0978 789 012', service: 'Thay bugi + dây cao áp', status: 'done', total: 950000, created: '06:00', updated: '09:00', assignedTo: 'Nguyễn Thế Anh', notes: ['Hoàn thành xuất sắc', 'Khách đã lấy xe 09:05'], vehicle: 'Toyota Camry 2018', odometer: 89300 },
  { id: 'WO-2407-007', plate: '51C-321.09', customer: 'Bùi Văn Thắng', phone: '0989 890 123', service: 'Sửa đèn xi nhan + đèn pha', status: 'done', total: 680000, created: '06:15', updated: '08:45', assignedTo: 'Trần Minh Đức', notes: ['Thay bóng LED loại tốt theo yêu cầu'], vehicle: 'Ford Ranger 2020', odometer: 74500 },
  { id: 'WO-2407-008', plate: '51H-654.32', customer: 'Ngô Thị Lan', phone: '0901 901 234', service: 'Kiểm tra hệ thống điện', status: 'intake', total: 500000, created: '09:30', updated: '09:30', assignedTo: 'Chưa giao', notes: ['Ắc quy yếu, khó khởi động buổi sáng'], vehicle: 'Mitsubishi Xpander 2021', odometer: 38900 },
]

const CUSTOMERS: Customer[] = [
  { id: 'CUS-001', name: 'Nguyễn Văn An', phone: '0901 234 567', email: 'an.nguyen@email.com', vehicles: ['Toyota Vios 2020 – 51A-123.45'], totalOrders: 8, lastVisit: '21/07/2026' },
  { id: 'CUS-002', name: 'Trần Thị Bích', phone: '0912 345 678', email: 'bich.tran@email.com', vehicles: ['Honda City 2022 – 51G-456.78'], totalOrders: 3, lastVisit: '21/07/2026' },
  { id: 'CUS-003', name: 'Phạm Quốc Hùng', phone: '0933 456 789', email: 'hung.pham@email.com', vehicles: ['Mazda CX-5 2019 – 59B-789.01', 'Yamaha Exciter – 59F-112.33'], totalOrders: 12, lastVisit: '21/07/2026' },
  { id: 'CUS-004', name: 'Lê Thị Hoa', phone: '0945 567 890', email: 'hoa.le@email.com', vehicles: ['Hyundai Santa Fe 2021 – 51K-234.56'], totalOrders: 5, lastVisit: '21/07/2026' },
  { id: 'CUS-005', name: 'Vũ Minh Tuấn', phone: '0967 678 901', email: 'tuan.vu@email.com', vehicles: ['Kia Seltos 2023 – 51F-567.89'], totalOrders: 2, lastVisit: '21/07/2026' },
  { id: 'CUS-006', name: 'Đỗ Thanh Hà', phone: '0978 789 012', email: 'ha.do@email.com', vehicles: ['Toyota Camry 2018 – 51A-890.12'], totalOrders: 17, lastVisit: '21/07/2026' },
  { id: 'CUS-007', name: 'Bùi Văn Thắng', phone: '0989 890 123', email: 'thang.bui@email.com', vehicles: ['Ford Ranger 2020 – 51C-321.09'], totalOrders: 9, lastVisit: '21/07/2026' },
  { id: 'CUS-008', name: 'Ngô Thị Lan', phone: '0901 901 234', email: 'lan.ngo@email.com', vehicles: ['Mitsubishi Xpander 2021 – 51H-654.32'], totalOrders: 4, lastVisit: '21/07/2026' },
]

const ESCALATIONS: EscalationItem[] = [
  { id: 'ESC-001', customer: 'Phạm Trọng Nghĩa', question: 'Chi phí thay hộp số tự động Camry 2017 hết bao nhiêu? Có bảo hành không?', channel: 'Zalo', waitMinutes: 47, plate: '51A-667.88', aiConfidence: 12 },
  { id: 'ESC-002', customer: 'Hoàng Văn Sơn', question: 'Xe mình bị rung khi chạy tốc độ 80-100km/h, cân bằng động hay thay lốp?', channel: 'Facebook', waitMinutes: 23, plate: '51B-334.55', aiConfidence: 28 },
  { id: 'ESC-003', customer: 'Nguyễn Minh Thu', question: 'Có thể lấy xe trong ngày hôm nay không? Mình cần dùng tối nay', channel: 'Zalo', waitMinutes: 12, plate: '59C-789.10', aiConfidence: 5 },
  { id: 'ESC-004', customer: 'Lê Quang Dũng', question: 'Xe Fortuner 2016 thay dầu hộp số sau bao nhiêu km? Dùng loại dầu gì?', channel: 'Website', waitMinutes: 8, plate: '51F-445.67', aiConfidence: 31 },
  { id: 'ESC-005', customer: 'Trần Bảo Châu', question: 'Bao giờ thì xưởng rảnh để đặt lịch? Tuần này kín hết chưa?', channel: 'Zalo', waitMinutes: 5, plate: '–', aiConfidence: 8 },
]

const TENANTS: Tenant[] = [
  { id: 'T-001', name: 'AutoCare Pro – Quận 7', city: 'TP.HCM', plan: 'Pro', ordersToday: 8, revenueMonth: 142000000, activeUsers: 6, aiStatus: 'healthy', n8nFlows: 12, lastSync: '2 phút trước', openEscalations: 5 },
  { id: 'T-002', name: 'Gara Thành Công', city: 'Hà Nội', plan: 'Pro', ordersToday: 14, revenueMonth: 218000000, activeUsers: 9, aiStatus: 'healthy', n8nFlows: 9, lastSync: '1 phút trước', openEscalations: 2 },
  { id: 'T-003', name: 'Xe Tốt Auto', city: 'Đà Nẵng', plan: 'Starter', ordersToday: 5, revenueMonth: 67000000, activeUsers: 3, aiStatus: 'degraded', n8nFlows: 4, lastSync: '18 phút trước', openEscalations: 8 },
  { id: 'T-004', name: 'Minh Phát Motors', city: 'Cần Thơ', plan: 'Starter', ordersToday: 3, revenueMonth: 38000000, activeUsers: 2, aiStatus: 'healthy', n8nFlows: 4, lastSync: '5 phút trước', openEscalations: 1 },
  { id: 'T-005', name: 'Hưng Thịnh Gara', city: 'Bình Dương', plan: 'Pro', ordersToday: 11, revenueMonth: 176000000, activeUsers: 7, aiStatus: 'down', n8nFlows: 11, lastSync: '43 phút trước', openEscalations: 14 },
]

const PLATFORM_WEEKLY = [
  { day: 'T2', orders: 41, tenants: 5 },
  { day: 'T3', orders: 57, tenants: 5 },
  { day: 'T4', orders: 38, tenants: 5 },
  { day: 'T5', orders: 63, tenants: 5 },
  { day: 'T6', orders: 52, tenants: 5 },
  { day: 'T7', orders: 71, tenants: 5 },
  { day: 'CN', orders: 29, tenants: 5 },
]

const WEEKLY_DATA = [
  { day: 'T2', orders: 11, revenue: 18500000 },
  { day: 'T3', orders: 14, revenue: 23200000 },
  { day: 'T4', orders: 9, revenue: 14800000 },
  { day: 'T5', orders: 16, revenue: 27100000 },
  { day: 'T6', orders: 13, revenue: 21400000 },
  { day: 'T7', orders: 18, revenue: 31600000 },
  { day: 'CN', orders: 8, revenue: 9800000 },
]

const STAFF = [
  { id: 'S-001', name: 'Lê Hoàng Nam', role: 'Kỹ thuật viên', phone: '0901 111 222', status: 'active', ordersToday: 2, ordosDone: 1 },
  { id: 'S-002', name: 'Nguyễn Thế Anh', role: 'Kỹ thuật viên', phone: '0912 222 333', status: 'active', ordersToday: 2, ordosDone: 1 },
  { id: 'S-003', name: 'Trần Minh Đức', role: 'Kỹ thuật viên', phone: '0933 333 444', status: 'active', ordersToday: 2, ordosDone: 2 },
  { id: 'S-004', name: 'Khánh Vân', role: 'Cố vấn dịch vụ', phone: '0945 444 555', status: 'active', ordersToday: 8, ordosDone: 6 },
  { id: 'S-005', name: 'Minh Trang', role: 'Cố vấn dịch vụ', phone: '0967 555 666', status: 'off', ordersToday: 0, ordosDone: 0 },
]

// ─── AI Config defaults ───────────────────────────────────────────────────────

const DEFAULT_AI_CONFIG = {
  allowed_topics: ['báo giá dịch vụ', 'lịch hẹn', 'trạng thái xe', 'hướng dẫn bảo dưỡng', 'chính sách bảo hành'],
  escalation_threshold: 30,
  response_language: 'vi',
  greeting_message: 'Xin chào! Tôi là trợ lý AI của AutoCare Pro. Tôi có thể giúp bạn về lịch hẹn, báo giá dịch vụ và trạng thái xe.',
  auto_close_after_minutes: 60,
  flowise_model: 'gpt-4o-mini',
  n8n_notify_channel: 'Zalo + Chatwoot',
}

// ─── Status + role config ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  intake:      { label: 'Tiếp nhận',   color: 'bg-slate-100 text-slate-600 border border-slate-200', dot: 'bg-slate-400',   card: 'border-l-slate-300' },
  in_progress: { label: 'Đang sửa',    color: 'bg-amber-50 text-amber-700 border border-amber-200',  dot: 'bg-amber-400',   card: 'border-l-amber-400' },
  ready:       { label: 'Chờ giao xe', color: 'bg-blue-50 text-blue-700 border border-blue-200',     dot: 'bg-blue-400',    card: 'border-l-blue-400' },
  done:        { label: 'Hoàn thành',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-400', card: 'border-l-emerald-400' },
} as const

const COLUMNS: { key: Status; label: string }[] = [
  { key: 'intake', label: 'Tiếp nhận' },
  { key: 'in_progress', label: 'Đang sửa' },
  { key: 'ready', label: 'Chờ giao xe' },
  { key: 'done', label: 'Hoàn thành' },
]

const ROLE_LABELS: Record<Role, string> = {
  service_advisor: 'Cố vấn dịch vụ',
  technician: 'Kỹ thuật viên',
  customer: 'Khách hàng',
  workshop_admin: 'Quản trị xưởng',
  platform_operator: 'Vận hành nền tảng',
}

const NAV_BY_ROLE: Record<Role, { view: View; label: string; icon: string; badge?: number }[]> = {
  service_advisor: [
    { view: 'board', label: 'Work Order Board', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { view: 'directory', label: 'Khách & Xe', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { view: 'escalation', label: 'Hàng chờ AI', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: ESCALATIONS.length },
  ],
  technician: [
    { view: 'my_orders', label: 'Lệnh của tôi', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { view: 'board', label: 'Tất cả lệnh', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ],
  customer: [
    { view: 'customer_status', label: 'Trạng thái xe', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  ],
  workshop_admin: [
    { view: 'overview', label: 'Tổng quan', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { view: 'board', label: 'Work Order Board', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { view: 'directory', label: 'Khách & Xe', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { view: 'staff', label: 'Nhân sự', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { view: 'escalation', label: 'Hàng chờ AI', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: ESCALATIONS.length },
    { view: 'ai_config', label: 'Cấu hình AI', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { view: 'care_campaigns', label: 'Chăm sóc & Chiến dịch', icon: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z' },
  ],
  platform_operator: [
    { view: 'platform', label: 'Multi-tenant', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { view: 'overview', label: 'Tổng quan', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { view: 'board', label: 'Work Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVnd(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' tr₫'
  return n.toLocaleString('vi-VN') + '₫'
}
function fmtVndFull(n: number) { return n.toLocaleString('vi-VN') + '₫' }

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, string> = {
    Zalo: 'bg-sky-50 text-sky-700 border border-sky-200',
    Facebook: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    Website: 'bg-violet-50 text-violet-700 border border-violet-200',
  }
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${map[channel] ?? 'bg-gray-100 text-gray-600'}`}>{channel}</span>
}

function AiStatusDot({ status }: { status: Tenant['aiStatus'] }) {
  const map = { healthy: 'bg-emerald-400', degraded: 'bg-amber-400', down: 'bg-red-500' }
  const label = { healthy: 'Hoạt động', degraded: 'Chậm', down: 'Ngừng' }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <span className={`h-2 w-2 rounded-full ${map[status]}`} />
      {label[status]}
    </span>
  )
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  )
}

// ─── Work Order Board ─────────────────────────────────────────────────────────

function BoardView({ onSelectOrder }: { onSelectOrder: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ORDERS.filter(o => !q || o.plate.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
  }, [search])

  return (
    <div>
      <SectionHeader
        title="Work Order Board"
        subtitle={`Thứ Hai, 21/07/2026 — ${ORDERS.length} lệnh`}
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm biển số, khách..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-gray-400 w-52 font-mono placeholder:font-sans placeholder:text-gray-400" />
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              Tạo lệnh
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
        {COLUMNS.map(col => {
          const orders = filtered.filter(o => o.status === col.key)
          const cfg = STATUS_CONFIG[col.key]
          return (
            <div key={col.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                </div>
                <span className="text-xs font-mono text-gray-400 font-medium">{orders.length}</span>
              </div>

              {orders.length === 0 && (
                <div className="h-20 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Trống</span>
                </div>
              )}
              {orders.map(o => (
                <button key={o.id} onClick={() => onSelectOrder(o.id)}
                  className={`w-full text-left bg-white border border-gray-200 rounded-lg p-3.5 border-l-4 ${cfg.card} hover:shadow-md hover:-translate-y-px transition-all duration-150`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-sm font-bold text-gray-900">{o.plate}</span>
                    <span className="font-mono text-[10px] text-gray-400">{o.id}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-800 mb-0.5 truncate">{o.customer}</div>
                  <div className="text-xs text-gray-500 mb-3 line-clamp-2">{o.service}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-gray-900">{fmtVndFull(o.total)}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{o.updated}</span>
                  </div>
                  {o.assignedTo !== 'Chưa giao' ? (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold text-gray-600">{o.assignedTo.split(' ').pop()?.[0]}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 truncate">{o.assignedTo}</span>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-gray-100">
                      <span className="text-[11px] text-amber-600 font-medium">Chưa giao KTV</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Work Order Detail ────────────────────────────────────────────────────────

function DetailView({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const o = ORDERS.find(x => x.id === orderId)!
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState(o.notes)
  const [status, setStatus] = useState<Status>(o.status)

  const nextStatus: Record<Status, Status | null> = { intake: 'in_progress', in_progress: 'ready', ready: 'done', done: null }
  const nextLabel: Record<Status, string> = { intake: 'Bắt đầu sửa', in_progress: 'Chờ giao xe', ready: 'Đã giao xe', done: '' }

  const addNote = () => {
    if (!note.trim()) return
    setNotes(p => [...p, note.trim()])
    setNote('')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900">{o.id}</h1>
          <p className="text-sm text-gray-500">Tạo lúc {o.created} · Cập nhật {o.updated}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <StatusBadge status={status} />
          {nextStatus[status] && (
            <button onClick={() => setStatus(nextStatus[status]!)}
              className="px-3 py-1.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap">
              {nextLabel[status]}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          <Card title="Thông tin xe">
            <div className="space-y-3">
              <Row label="Biển số" value={<span className="font-mono font-bold text-gray-900">{o.plate}</span>} />
              <Row label="Phương tiện" value={o.vehicle} />
              <Row label="Odometer" value={<span className="font-mono">{o.odometer.toLocaleString()} km</span>} />
            </div>
          </Card>
          <Card title="Thông tin khách hàng">
            <div className="space-y-3">
              <Row label="Họ tên" value={o.customer} />
              <Row label="Điện thoại" value={<span className="font-mono">{o.phone}</span>} />
            </div>
          </Card>
          <Card title="Dịch vụ & Chi phí">
            <div className="space-y-3">
              <Row label="Dịch vụ" value={o.service} />
              <Row label="Kỹ thuật viên" value={o.assignedTo} />
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Tổng tạm tính</span>
                <span className="font-mono text-xl font-bold text-gray-900">{fmtVndFull(o.total)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Ghi chú kỹ thuật">
            <div className="space-y-2 mb-4">
              {notes.map((n, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{n}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <input value={note} onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Thêm ghi chú..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400" />
              <button onClick={addNote} className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Thêm</button>
            </div>
          </Card>
          <Card title="Lịch sử trạng thái">
            <div className="relative">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-5">
                {(['intake', 'in_progress', 'ready', 'done'] as Status[]).map((s, i) => {
                  const statuses: Status[] = ['intake', 'in_progress', 'ready', 'done']
                  const passed = i <= statuses.indexOf(status)
                  const cfg = STATUS_CONFIG[s]
                  const times = [o.created, '09:00', '11:30', '–']
                  return (
                    <div key={s} className="flex gap-3 items-start pl-5 relative">
                      <span className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 z-10 ${passed ? `${cfg.dot} border-transparent` : 'bg-white border-gray-200'}`} />
                      <div>
                        <p className={`text-sm font-medium ${passed ? 'text-gray-900' : 'text-gray-400'}`}>{cfg.label}</p>
                        {passed && <p className="text-xs text-gray-400 font-mono">{times[i]}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ─── Customer Directory ───────────────────────────────────────────────────────

function DirectoryView() {
  const [search, setSearch] = useState('')
  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.vehicles.some(v => v.toLowerCase().includes(q))
  })
  return (
    <div>
      <SectionHeader title="Khách hàng & Xe" subtitle={`${CUSTOMERS.length} khách hàng`}
        action={
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên, SĐT, biển số..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-gray-400 w-56" />
          </div>
        }
      />
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Khách hàng', 'Điện thoại', 'Phương tiện', 'Lần cuối', 'Lệnh'].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500">{c.name.split(' ').pop()?.[0]}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className="font-mono text-gray-700">{c.phone}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1">
                      {c.vehicles.map((v, i) => (
                        <span key={i} className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-700 w-fit">{v.split(' – ')[1] || v}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{c.lastVisit}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-mono font-bold text-gray-700">{c.totalOrders}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Escalation Queue ─────────────────────────────────────────────────────────

function EscalationView() {
  const [items, setItems] = useState(ESCALATIONS)
  const sorted = [...items].sort((a, b) => b.waitMinutes - a.waitMinutes)
  return (
    <div>
      <SectionHeader title="Hàng chờ AI" subtitle={`${items.length} câu hỏi chờ xử lý — sắp xếp theo thời gian chờ`}
        action={
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Flowise đang hoạt động
          </div>
        }
      />
      <div className="flex flex-col gap-3">
        {sorted.map(item => (
          <div key={item.id} className={`bg-white border rounded-xl p-4 sm:p-5 flex gap-4 items-start ${item.waitMinutes > 30 ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex-shrink-0 text-center w-12">
              <div className={`text-2xl font-mono font-bold tabular-nums ${item.waitMinutes > 30 ? 'text-red-600' : item.waitMinutes > 15 ? 'text-amber-600' : 'text-gray-400'}`}>{item.waitMinutes}</div>
              <div className="text-[10px] text-gray-400">phút</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-medium text-sm text-gray-900">{item.customer}</span>
                {item.plate !== '–' && <span className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">{item.plate}</span>}
                <ChannelBadge channel={item.channel} />
                <span className="ml-auto text-[10px] font-mono text-gray-400">{item.id}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3 italic">"{item.question}"</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-28">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">AI tin cậy</span>
                    <span className="text-[10px] font-mono text-gray-500">{item.aiConfidence}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full">
                    <div className="h-1 bg-red-300 rounded-full" style={{ width: `${item.aiConfidence}%` }} />
                  </div>
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setItems(p => p.filter(x => x.id !== item.id))}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Bỏ qua</button>
                  <button className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Trả lời ngay</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl py-16 flex flex-col items-center gap-3 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm">Không còn câu hỏi chờ xử lý</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Workshop Overview ────────────────────────────────────────────────────────

function OverviewView() {
  const todayRevenue = ORDERS.reduce((s, o) => s + o.total, 0)
  const byStatus = COLUMNS.map(c => ({ ...c, count: ORDERS.filter(o => o.status === c.key).length }))
  return (
    <div>
      <SectionHeader title="Tổng quan xưởng" subtitle="AutoCare Pro — Thứ Hai, 21/07/2026" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {byStatus.map(s => {
          const cfg = STATUS_CONFIG[s.key]
          return (
            <div key={s.key} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
              </div>
              <div className="font-mono text-4xl font-bold text-gray-900">{s.count}</div>
              <div className="text-xs text-gray-400 mt-1">lệnh hôm nay</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Doanh thu hôm nay</h2>
          <div className="font-mono text-2xl font-bold text-gray-900">{fmtVnd(todayRevenue)}</div>
          <div className="text-xs text-gray-400 mt-1">từ {ORDERS.length} lệnh</div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Trung bình/lệnh</span>
              <span className="font-mono font-semibold text-gray-900">{fmtVnd(Math.round(todayRevenue / ORDERS.length))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cao nhất</span>
              <span className="font-mono font-semibold text-gray-900">{fmtVnd(Math.max(...ORDERS.map(o => o.total)))}</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Số lệnh trong tuần</h2>
          <ResponsiveContainer width="100%" height={148}>
            <BarChart data={WEEKLY_DATA} barSize={26}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#d1d5db' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} cursor={{ fill: '#f9fafb' }} formatter={(v: number) => [v + ' lệnh', '']} />
              <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                {WEEKLY_DATA.map((_, i) => <Cell key={i} fill={i === 5 ? '#111827' : '#e5e7eb'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Kỹ thuật viên hôm nay</h2>
        <div className="space-y-4">
          {STAFF.filter(s => s.role === 'Kỹ thuật viên').map(tech => (
            <div key={tech.id} className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-gray-500">{tech.name.split(' ').pop()?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-800">{tech.name}</span>
                  <span className="font-mono text-xs text-gray-500">{tech.ordosDone}/{tech.ordersToday} lệnh</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 bg-emerald-400 rounded-full transition-all" style={{ width: `${tech.ordersToday ? (tech.ordosDone / tech.ordersToday) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── AI Config ────────────────────────────────────────────────────────────────

function AiConfigView() {
  const [cfg, setCfg] = useState(DEFAULT_AI_CONFIG)
  const [newTopic, setNewTopic] = useState('')
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const removeTopic = (t: string) => setCfg(p => ({ ...p, allowed_topics: p.allowed_topics.filter(x => x !== t) }))
  const addTopic = () => {
    if (!newTopic.trim()) return
    setCfg(p => ({ ...p, allowed_topics: [...p.allowed_topics, newTopic.trim()] }))
    setNewTopic('')
  }

  return (
    <div>
      <SectionHeader title="Cấu hình AI — Flowise" subtitle="Điều chỉnh hành vi trợ lý AI cho xưởng này"
        action={
          <button onClick={save}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            {saved ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Đã lưu</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>Lưu cấu hình</>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Allowed topics */}
        <div className="lg:col-span-2">
          <Card title="Chủ đề AI được phép tự trả lời (allowed_topics)">
            <p className="text-xs text-gray-500 mb-4">Flowise chỉ tự trả lời các chủ đề này. Câu hỏi ngoài danh sách sẽ được escalate sang cố vấn dịch vụ.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {cfg.allowed_topics.map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700 group">
                  {t}
                  <button onClick={() => removeTopic(t)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTopic} onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTopic()}
                placeholder="Thêm chủ đề mới..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400" />
              <button onClick={addTopic} className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Thêm</button>
            </div>
          </Card>
        </div>

        <Card title="Lời chào tự động">
          <textarea value={cfg.greeting_message}
            onChange={e => setCfg(p => ({ ...p, greeting_message: e.target.value }))}
            rows={4} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-gray-400 resize-none leading-relaxed" />
          <p className="text-xs text-gray-400 mt-2">Hiển thị khi khách hàng bắt đầu chat lần đầu</p>
        </Card>

        <Card title="Tham số hệ thống">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Ngưỡng tin cậy escalate (%)</label>
              <div className="flex items-center gap-3">
                <input type="range" min={10} max={80} value={cfg.escalation_threshold}
                  onChange={e => setCfg(p => ({ ...p, escalation_threshold: +e.target.value }))}
                  className="flex-1 accent-gray-900" />
                <span className="font-mono text-sm font-bold w-8 text-right text-gray-900">{cfg.escalation_threshold}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">AI không tự trả lời nếu độ tin cậy dưới ngưỡng này</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Tự đóng chat sau (phút)</label>
              <input type="number" value={cfg.auto_close_after_minutes}
                onChange={e => setCfg(p => ({ ...p, auto_close_after_minutes: +e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Ngôn ngữ phản hồi</label>
              <select value={cfg.response_language}
                onChange={e => setCfg(p => ({ ...p, response_language: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 bg-white">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </Card>

        <Card title="Tích hợp">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Model AI (Flowise)</label>
              <select value={cfg.flowise_model}
                onChange={e => setCfg(p => ({ ...p, flowise_model: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 bg-white font-mono">
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Kênh thông báo n8n</label>
              <input value={cfg.n8n_notify_channel}
                onChange={e => setCfg(p => ({ ...p, n8n_notify_channel: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 font-mono" />
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-800">n8n Automation</div>
                  <div className="text-xs text-gray-500">12 flows đang hoạt động</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Kết nối
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-800">Chatwoot</div>
                  <div className="text-xs text-gray-500">Zalo, Facebook, Website</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Kết nối
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Staff Management ─────────────────────────────────────────────────────────

const CARE_RULES = [
  { id: 'r1', name: 'Chúc mừng sinh nhật', trigger: 'Customer Birthday', audience: 'Tất cả khách hàng', active: true, channel: 'Ưu tiên mặc định' },
  { id: 'r2', name: 'Ngày Nhà giáo Việt Nam (20/11)', trigger: 'Vietnamese Teachers Day (20/11)', audience: 'occupation = Giáo viên', active: true, channel: 'Ưu tiên mặc định' },
  { id: 'r3', name: 'Nhắc bảo dưỡng định kỳ', trigger: 'Days Since Last Service', audience: 'days_since_service > 90', active: true, channel: 'Ưu tiên mặc định' },
]

const CAMPAIGNS = [
  { id: 'c1', name: 'Khuyến mãi bảo dưỡng cuối năm', segment: 'Tất cả khách hàng đã opt-in', status: 'Đã lên lịch', date: '01/08/2026', channel: 'Ép: Email' },
  { id: 'c2', name: 'Ưu đãi khách VIP', segment: 'customer_tags chứa "vip"', status: 'Nháp', date: '—', channel: 'Ưu tiên mặc định' },
]

function RuleStatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? 'Đang hoạt động' : 'Tắt'}
    </span>
  )
}

function CampaignStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Nháp': 'bg-gray-100 text-gray-600',
    'Chờ duyệt': 'bg-amber-50 text-amber-700',
    'Đã lên lịch': 'bg-blue-50 text-blue-700',
    'Đã gửi': 'bg-emerald-50 text-emerald-700',
    'Hủy': 'bg-red-50 text-red-600',
  }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>
}

function CareCampaignsView() {
  return (
    <div>
      <SectionHeader title="Chăm sóc & Chiến dịch" subtitle="Nhắn tin tự động theo dịp cá nhân, và chiến dịch marketing broadcast theo phân khúc" />

      <div className="mb-3 p-3.5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed">
        Chiến dịch marketing chỉ gửi cho khách hàng đã tick <span className="font-medium">"Đồng ý nhận tin marketing"</span> — theo Nghị định 91/2020/NĐ-CP. Nhắc nhắc cá nhân (sinh nhật, bảo dưỡng) không thuộc diện này vì là chăm sóc dịch vụ, không phải quảng cáo.
      </div>

      <Card title="Quy tắc chăm sóc tự động (theo từng khách hàng)">
        <p className="text-xs text-gray-500 mb-4">Kích hoạt tự động theo sự kiện hoặc thuộc tính từng khách — chạy qua n8n Cron, đọc bảng Gara Care Automation Rule.</p>
        <div className="divide-y divide-gray-100">
          {CARE_RULES.map(r => (
            <div key={r.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{r.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">Đối tượng: {r.audience} · Kênh: {r.channel}</div>
              </div>
              <RuleStatusBadge active={r.active} />
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Thêm quy tắc mới
        </button>
      </Card>

      <div className="mt-5">
        <Card title="Chiến dịch marketing (broadcast theo phân khúc)">
          <p className="text-xs text-gray-500 mb-4">Admin chủ động tạo, cần duyệt trước khi gửi — khác bản chất quy tắc chăm sóc ở trên.</p>
          <div className="divide-y divide-gray-100">
            {CAMPAIGNS.map(c => (
              <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Phân khúc: {c.segment} · {c.date !== '—' ? `Lịch: ${c.date}` : 'Chưa lên lịch'}</div>
                </div>
                <CampaignStatusBadge status={c.status} />
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Tạo chiến dịch mới
          </button>
        </Card>
      </div>
    </div>
  )
}

function StaffView() {
  return (
    <div>
      <SectionHeader title="Nhân sự" subtitle={`${STAFF.length} thành viên`}
        action={
          <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Thêm nhân viên
          </button>
        }
      />
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Nhân viên', 'Chức vụ', 'Điện thoại', 'Trạng thái', 'Hôm nay'].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {STAFF.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.status === 'active' ? 'bg-gray-200' : 'bg-gray-100'}`}>
                        <span className={`text-xs font-bold ${s.status === 'active' ? 'text-gray-600' : 'text-gray-400'}`}>{s.name.split(' ').pop()?.[0]}</span>
                      </div>
                      <span className={`font-medium ${s.status === 'active' ? 'text-gray-900' : 'text-gray-400'}`}>{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{s.role}</td>
                  <td className="px-5 py-3.5"><span className="font-mono text-gray-700">{s.phone}</span></td>
                  <td className="px-5 py-3.5 text-right">
                    {s.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Đang làm
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />Nghỉ
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {s.ordersToday > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-emerald-400 rounded-full" style={{ width: `${(s.ordosDone / s.ordersToday) * 100}%` }} />
                        </div>
                        <span className="font-mono text-xs text-gray-600">{s.ordosDone}/{s.ordersToday}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Technician: My Orders ────────────────────────────────────────────────────

function MyOrdersView({ onSelectOrder }: { onSelectOrder: (id: string) => void }) {
  const myOrders = ORDERS.filter(o => o.assignedTo === 'Lê Hoàng Nam')
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all')
  const filtered = selectedStatus === 'all' ? myOrders : myOrders.filter(o => o.status === selectedStatus)

  return (
    <div>
      <SectionHeader title="Lệnh của tôi" subtitle={`Lê Hoàng Nam — ${myOrders.length} lệnh được giao hôm nay`} />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {([
          { label: 'Tổng được giao', val: myOrders.length, color: 'text-gray-900' },
          { label: 'Đang thực hiện', val: myOrders.filter(o => o.status === 'in_progress').length, color: 'text-amber-600' },
          { label: 'Hoàn thành', val: myOrders.filter(o => o.status === 'done').length, color: 'text-emerald-600' },
        ]).map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`font-mono text-3xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {([['all', 'Tất cả'], ['in_progress', 'Đang sửa'], ['ready', 'Chờ giao'], ['done', 'Xong']] as [Status | 'all', string][]).map(([s, l]) => (
          <button key={s} onClick={() => setSelectedStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(o => {
          const cfg = STATUS_CONFIG[o.status]
          return (
            <button key={o.id} onClick={() => onSelectOrder(o.id)}
              className={`w-full text-left bg-white border border-gray-200 rounded-xl p-4 border-l-4 ${cfg.card} hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-mono text-base font-bold text-gray-900">{o.plate}</span>
                  <span className="text-sm text-gray-500 ml-2">{o.vehicle}</span>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="text-sm text-gray-700 mb-1">{o.service}</div>
              <div className="text-sm text-gray-500 mb-3">{o.customer} · {o.phone}</div>
              {o.notes.length > 0 && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-100">
                  <span className="font-medium">Ghi chú:</span> {o.notes[o.notes.length - 1]}
                </div>
              )}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span className="font-mono text-sm font-bold text-gray-900">{fmtVndFull(o.total)}</span>
                <span className="text-xs text-gray-400 font-mono">Cập nhật {o.updated}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Platform Operator ────────────────────────────────────────────────────────

function PlatformView() {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const totalOrders = TENANTS.reduce((s, t) => s + t.ordersToday, 0)
  const totalRevenue = TENANTS.reduce((s, t) => s + t.revenueMonth, 0)
  const unhealthyCount = TENANTS.filter(t => t.aiStatus !== 'healthy').length

  if (selectedTenant) {
    const t = TENANTS.find(x => x.id === selectedTenant)!
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSelectedTenant(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{t.name}</h1>
            <p className="text-sm text-gray-500">{t.city} · Gói {t.plan}</p>
          </div>
          <div className="ml-auto">
            <AiStatusDot status={t.aiStatus} />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Lệnh hôm nay', val: t.ordersToday, mono: true },
            { label: 'Doanh thu tháng', val: fmtVnd(t.revenueMonth), mono: true },
            { label: 'Người dùng', val: t.activeUsers, mono: true },
            { label: 'Escalation mở', val: t.openEscalations, mono: true },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">{kpi.label}</div>
              <div className="font-mono text-2xl font-bold text-gray-900">{kpi.val}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Tích hợp">
            <div className="space-y-3">
              <Row label="n8n Flows" value={<span className="font-mono font-bold">{t.n8nFlows} active</span>} />
              <Row label="AI (Flowise)" value={<AiStatusDot status={t.aiStatus} />} />
              <Row label="Đồng bộ cuối" value={<span className="font-mono text-xs">{t.lastSync}</span>} />
              <Row label="Escalation chờ" value={
                <span className={`font-mono font-bold ${t.openEscalations > 5 ? 'text-red-600' : 'text-gray-900'}`}>{t.openEscalations}</span>
              } />
            </div>
          </Card>
          <Card title="Thao tác nhanh">
            <div className="space-y-2.5">
              {[
                { label: 'Xem Work Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { label: 'Khởi động lại Flowise', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
                { label: 'Xem logs hệ thống', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { label: 'Cấu hình whitelabel', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
              ].map(a => (
                <button key={a.label} className="w-full flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {a.icon.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
                  </svg>
                  {a.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title="Multi-tenant — Toàn nền tảng" subtitle="Vận hành nền tảng · 21/07/2026" />

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Xưởng hoạt động', val: TENANTS.length, sub: 'tất cả online' },
          { label: 'Lệnh toàn nền tảng', val: totalOrders, sub: 'hôm nay' },
          { label: 'Doanh thu tháng', val: fmtVnd(totalRevenue), sub: 'tạm tính' },
          { label: 'AI cần chú ý', val: unhealthyCount, sub: `/${TENANTS.length} xưởng`, urgent: unhealthyCount > 0 },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white border rounded-xl p-5 ${kpi.urgent ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="text-xs text-gray-500 mb-2">{kpi.label}</div>
            <div className={`font-mono text-2xl font-bold ${kpi.urgent ? 'text-red-600' : 'text-gray-900'}`}>{kpi.val}</div>
            <div className={`text-xs mt-1 ${kpi.urgent ? 'text-red-400' : 'text-gray-400'}`}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly platform chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Lệnh toàn nền tảng — 7 ngày</h2>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={PLATFORM_WEEKLY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#d1d5db' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [v + ' lệnh', 'Tổng']} />
            <Line type="monotone" dataKey="orders" stroke="#111827" strokeWidth={2} dot={{ fill: '#111827', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tenant table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Danh sách xưởng</h2>
          <span className="text-xs text-gray-500">{TENANTS.length} tenants</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Xưởng', 'Gói', 'Lệnh hôm nay', 'Doanh thu tháng', 'AI', 'Escalation', 'Đồng bộ'].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TENANTS.map(t => (
                <tr key={t.id} onClick={() => setSelectedTenant(t.id)}
                  className={`cursor-pointer transition-colors ${t.aiStatus === 'down' ? 'hover:bg-red-50 bg-red-50/30' : 'hover:bg-gray-50'}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.city} · {t.id}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${t.plan === 'Pro' ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-gray-100 text-gray-600'}`}>{t.plan}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-900">{t.ordersToday}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-700">{fmtVnd(t.revenueMonth)}</td>
                  <td className="px-5 py-3.5 text-right"><AiStatusDot status={t.aiStatus} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-mono font-bold ${t.openEscalations > 5 ? 'text-red-600' : 'text-gray-700'}`}>{t.openEscalations}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-400 font-mono">{t.lastSync}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Customer Status ──────────────────────────────────────────────────────────

function CustomerStatusView() {
  const order = ORDERS.find(o => o.plate === '51K-234.56')!
  const steps: { status: Status; time: string; note: string }[] = [
    { status: 'intake', time: '07:00', note: 'Xe đã được tiếp nhận tại xưởng' },
    { status: 'in_progress', time: '08:30', note: 'Kỹ thuật viên đang thực hiện thay má phanh' },
    { status: 'ready', time: '11:30', note: 'Xe đã sẵn sàng — quý khách có thể đến lấy' },
    { status: 'done', time: '–', note: 'Đã bàn giao xe cho khách hàng' },
  ]
  const currentIdx = 2

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-3 text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-gray-100 items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.75"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <div className="font-mono text-2xl font-bold text-gray-900 mb-1">{order.plate}</div>
          <div className="text-sm text-gray-500 mb-4">{order.vehicle} · {order.customer}</div>
          <StatusBadge status="ready" />
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            Xe đã sẵn sàng. Vui lòng đến nhận xe tại xưởng.
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Tiến độ sửa chữa</h2>
          <div className="relative">
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-100" />
            <div className="space-y-6">
              {steps.map((step, i) => {
                const cfg = STATUS_CONFIG[step.status]
                const done = i <= currentIdx
                return (
                  <div key={step.status} className="flex gap-4 items-start pl-7 relative">
                    <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 z-10 ${done ? `${cfg.dot} border-transparent` : 'bg-white border-gray-200'}`}>
                      {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-300'}`}>{cfg.label}</span>
                        <span className={`font-mono text-xs ${done ? 'text-gray-500' : 'text-gray-300'}`}>{step.time}</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${done ? 'text-gray-600' : 'text-gray-300'}`}>{step.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Dịch vụ</span>
            <span className="text-gray-900 font-medium text-right ml-4">{order.service}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Tổng tạm tính</span>
            <span className="font-mono text-lg font-bold text-gray-900">{fmtVndFull(order.total)}</span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400">AutoCare Pro · Hotline: 1900 xxxx</p>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ role, currentView, onViewChange, onRoleChange, open, setOpen }: {
  role: Role; currentView: View; onViewChange: (v: View) => void
  onRoleChange: (r: Role) => void; open: boolean; setOpen: (v: boolean) => void
}) {
  const navItems = NAV_BY_ROLE[role]
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-gray-100 flex-shrink-0">
          <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z" />
              <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 9h14" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">AutoCare Pro</div>
            <div className="text-[10px] text-gray-400">Gara CRM</div>
          </div>
        </div>

        {/* Role switcher */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Vai trò demo</div>
          <select value={role} onChange={e => onRoleChange(e.target.value as Role)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 outline-none focus:border-gray-400 font-medium cursor-pointer">
            {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, l]) => (
              <option key={r} value={r}>{l}</option>
            ))}
          </select>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.view} onClick={() => { onViewChange(item.view); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${currentView === item.view ? 'bg-gray-900 text-white font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                {item.icon.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
              </svg>
              <span className="truncate">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-600">KV</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">Khánh Vân</div>
              <div className="text-[10px] text-gray-400 truncate">{ROLE_LABELS[role]}</div>
            </div>
            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [role, setRole] = useState<Role>('service_advisor')
  const [view, setView] = useState<View>('board')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleRoleChange = (r: Role) => {
    setRole(r)
    setView(NAV_BY_ROLE[r][0].view)
    setSelectedOrderId(null)
  }

  const handleViewChange = (v: View) => {
    setView(v)
    setSelectedOrderId(null)
  }

  if (view === 'customer_status') {
    return <CustomerStatusView />
  }

  const isDetail = !!selectedOrderId
  const activeView = isDetail ? 'detail' : view

  const breadcrumb = isDetail
    ? selectedOrderId
    : NAV_BY_ROLE[role].find(n => n.view === view)?.label ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        role={role} currentView={view}
        onViewChange={handleViewChange}
        onRoleChange={handleRoleChange}
        open={sidebarOpen} setOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-5 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
            <span className="text-gray-300 hidden sm:block">/</span>
            <span className="font-medium text-gray-900 truncate">{breadcrumb}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Hệ thống bình thường
            </div>
            <button className="relative p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          {activeView === 'detail' && selectedOrderId ? (
            <DetailView orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />
          ) : view === 'board' ? (
            <BoardView onSelectOrder={id => setSelectedOrderId(id)} />
          ) : view === 'my_orders' ? (
            <MyOrdersView onSelectOrder={id => setSelectedOrderId(id)} />
          ) : view === 'directory' ? (
            <DirectoryView />
          ) : view === 'escalation' ? (
            <EscalationView />
          ) : view === 'overview' ? (
            <OverviewView />
          ) : view === 'ai_config' ? (
            <AiConfigView />
          ) : view === 'staff' ? (
            <StaffView />
          ) : view === 'care_campaigns' ? (
            <CareCampaignsView />
          ) : view === 'platform' ? (
            <PlatformView />
          ) : null}
        </main>
      </div>
    </div>
  )
}
