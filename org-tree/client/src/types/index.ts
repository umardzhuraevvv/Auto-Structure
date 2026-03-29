export interface Employee {
  id: number;
  fullName: string;
  position: string;
  department: string;
  duties: string | null;
  managerId: number | null;
  photoUrl: string | null;
  manager?: Employee | null;
  subordinates?: Employee[];
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export interface AuditEntry {
  id: number;
  userId: number;
  action: string;
  target: string;
  details: string | null;
  createdAt: string;
}
