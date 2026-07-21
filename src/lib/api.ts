// Lớp gọi API tập trung — mọi fetch tới ERPNext đi qua đây.
// KHÔNG hardcode URL backend ở bất kỳ component nào khác.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function fetchDoctype<T>(doctype: string, filters?: unknown[][]): Promise<T[]> {
  const params = filters ? `?filters=${encodeURIComponent(JSON.stringify(filters))}` : ''
  const res = await fetch(`${API_BASE}/api/resource/${encodeURIComponent(doctype)}${params}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // dùng session cookie của Frappe — cần bật CORS + cùng domain hoặc proxy
  })
  if (!res.ok) throw new Error(`API lỗi ${res.status}: ${doctype}`)
  const json = await res.json()
  return json.data as T[]
}

export async function createDoctype<T>(doctype: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/api/resource/${encodeURIComponent(doctype)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`API lỗi ${res.status}: tạo ${doctype} thất bại`)
  return (await res.json()).data as T
}
