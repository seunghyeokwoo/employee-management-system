export interface Department {
  id: number;
  name: string;
  description: string | null;
  employee_count: number;
}

export interface Position {
  id: number;
  name: string;
  description: string | null;
  employee_count: number;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  department_id: number | null;
  position_id: number | null;
  department_name: string | null;
  position_name: string | null;
}

export interface EmployeePage {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = `요청이 실패했습니다 (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface EmployeeFilters {
  search?: string;
  department_id?: number | null;
  position_id?: number | null;
  page?: number;
}

export function fetchEmployees(filters: EmployeeFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.department_id != null)
    params.set("department_id", String(filters.department_id));
  if (filters.position_id != null)
    params.set("position_id", String(filters.position_id));
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", "20");
  return request<EmployeePage>(`/api/employees?${params.toString()}`);
}

export interface EmployeeInput {
  name: string;
  email: string;
  department_id: number | null;
  position_id: number | null;
}

export function createEmployee(data: EmployeeInput) {
  return request<Employee>("/api/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEmployee(id: number, data: EmployeeInput) {
  return request<Employee>(`/api/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteEmployee(id: number) {
  return request<void>(`/api/employees/${id}`, { method: "DELETE" });
}

export function fetchDepartments() {
  return request<Department[]>("/api/departments");
}

export function createDepartment(data: { name: string; description?: string | null }) {
  return request<Department>("/api/departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDepartment(
  id: number,
  data: { name: string; description?: string | null }
) {
  return request<Department>(`/api/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteDepartment(id: number) {
  return request<void>(`/api/departments/${id}`, { method: "DELETE" });
}

export function fetchPositions() {
  return request<Position[]>("/api/positions");
}

export function createPosition(data: { name: string; description?: string | null }) {
  return request<Position>("/api/positions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePosition(
  id: number,
  data: { name: string; description?: string | null }
) {
  return request<Position>(`/api/positions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deletePosition(id: number) {
  return request<void>(`/api/positions/${id}`, { method: "DELETE" });
}
