export enum Role {
  INFRA_ANALYST = "Analista de Infraestrutura",
  DBA = "DBA",
  TECH_RELATIONSHIP = "Tech Relationship",
  PROJECT_ANALYST = "Analista de Projetos",
  SUPERVISOR = "Supervisor",
  MONITORING_ANALYST = "Analista de Monitoramento",
  INTERN = "Estagiário",
  INFRA_ASSISTANT = "Assistente de Infraestrutura",
  MONITORING_ASSISTANT = "Assistente de Monitoramento",
  DB_ASSISTANT = "Assistente de Banco de Dados",
}

export enum Squad {
  LAKERS = "Lakers",
  BULLS = "Bulls",
  WARRIORS = "Warriors",
  ROCKETS = "Rockets",
}

export enum View {
  DASHBOARD,
  EMPLOYEES,
  ABSENCES,
  SHIFT_CHANGES,
  ON_CALL,
  USERS,
  LOGS,
}

export interface Employee {
  id: string;
  matricula: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  squad: Squad;
  shiftStart: string; // Format "HH:mm"
  shiftEnd: string; // Format "HH:mm"
}

export interface Absence {
  id: string;
  employeeId: string;
  reason: string;
  date: string; // ISO Date string YYYY-MM-DD (Start Date)
  endDate: string; // ISO Date string YYYY-MM-DD (End Date)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  observation: string;
  approved: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface ShiftChange {
  id: string;
  employeeId: string;
  originalShiftStart: string;
  originalShiftEnd: string;
  newShiftStart: string;
  newShiftEnd: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface OnCallShift {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  observation: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password: string; // Stored as plain text for this demo mock
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
}

export interface SystemLog {
  id: string;
  action: string;
  description: string;
  userName: string;
  createdAt: string;
}

export interface SystemStats {
  totalEmployees: number;
  totalAbsences: number;
  roleDistribution: { name: string; value: number }[];
}

// Helper to check if a window fits inside a shift
export const isTimeInShift = (
  shiftStart: string,
  shiftEnd: string,
  checkStart: string,
  checkEnd: string
): boolean => {
  return shiftStart <= checkStart && shiftEnd >= checkEnd;
};

// Helper to check if two time windows overlap
export const doTimesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  // Overlap occurs if StartA < EndB && StartB < EndA
  return start1 < end2 && start2 < end1;
};
