import {
  Employee,
  Absence,
  ShiftChange,
  OnCallShift,
  SystemUser,
  SystemLog,
} from "../types";

// --- CONFIGURAÇÃO DA API ---
// Substitua SEU_IP_DA_ORACLE pelo IP público do seu servidor na Oracle.
// Se estiver testando no seu próprio computador, use 'http://localhost:5000'
const API_URL = "http://163.176.231.117:5000";

export const getSystemLogs = async (): Promise<SystemLog[]> => {
  try {
    const response = await fetch(`${API_URL}/logs`);
    if (!response.ok) throw new Error("Erro ao buscar logs");
    return await response.json();
  } catch (error) {
    console.error("Erro getSystemLogs:", error);
    return [];
  }
};

// Função auxiliar para gravar logs (se quiser usar nos outros componentes)
export const createLog = async (
  action: string,
  description: string,
  userName: string
) => {
  try {
    await fetch(`${API_URL}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, description, userName }),
    });
  } catch (error) {
    console.error("Erro ao salvar log", error);
  }
};

// --- EMPLOYEES (FUNCIONÁRIOS) ---

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await fetch(`${API_URL}/employees`);
    if (!response.ok) throw new Error("Erro ao buscar funcionários");
    return await response.json();
  } catch (error) {
    console.error("Erro getEmployees:", error);
    return [];
  }
};

export const saveEmployee = async (
  employee: Employee,
  user?: string
): Promise<Employee | null> => {
  try {
    // Se tiver ID longo (UUID), é edição (PUT). Senão, é criação (POST).
    const isEditing = employee.id && employee.id.length > 10;
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/employees/${employee.id}`
      : `${API_URL}/employees`;

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });

    if (!response.ok) throw new Error("Erro ao salvar funcionário");
    return await response.json();
  } catch (error) {
    console.error("Erro saveEmployee:", error);
    throw error;
  }
};

export const deleteEmployee = async (
  id: string,
  adminName: string
): Promise<void> => {
  try {
    await fetch(`${API_URL}/employees/${id}`, { method: "DELETE" });
  } catch (error) {
    console.error("Erro deleteEmployee:", error);
  }
};

// --- ABSENCES (AUSÊNCIAS) ---

export const getAbsences = async (): Promise<Absence[]> => {
  try {
    const response = await fetch(`${API_URL}/absences`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Erro getAbsences:", error);
    return [];
  }
};

export const saveAbsence = async (absence: Absence): Promise<void> => {
  try {
    // Ajuste similar para diferenciar POST/PUT se necessário, ou usar sempre POST para novos
    const method = absence.id && absence.id.length > 10 ? "PUT" : "POST";
    const url =
      method === "PUT"
        ? `${API_URL}/absences/${absence.id}`
        : `${API_URL}/absences`;

    await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(absence),
    });
  } catch (error) {
    console.error("Erro saveAbsence:", error);
    throw error;
  }
};

export const deleteAbsence = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/absences/${id}`, { method: "DELETE" });
  } catch (error) {
    console.error("Erro deleteAbsence:", error);
  }
};

// --- SHIFT CHANGES (TROCAS DE TURNO) ---

export const getShiftChanges = async (): Promise<ShiftChange[]> => {
  try {
    const response = await fetch(`${API_URL}/shift-changes`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Erro getShiftChanges:", error);
    return [];
  }
};

export const saveShiftChange = async (
  shiftChange: ShiftChange
): Promise<void> => {
  try {
    await fetch(`${API_URL}/shift-changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shiftChange),
    });
  } catch (error) {
    console.error("Erro saveShiftChange:", error);
    throw error;
  }
};

export const deleteShiftChange = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/shift-changes/${id}`, { method: "DELETE" });
  } catch (error) {
    console.error("Erro deleteShiftChange:", error);
  }
};

// --- ON CALL SHIFTS (PLANTÕES) ---

export const getOnCallShifts = async (): Promise<OnCallShift[]> => {
  try {
    const response = await fetch(`${API_URL}/on-call`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Erro getOnCallShifts:", error);
    return [];
  }
};

export const saveOnCallShift = async (shift: OnCallShift): Promise<void> => {
  try {
    await fetch(`${API_URL}/on-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shift),
    });
  } catch (error) {
    console.error("Erro saveOnCallShift:", error);
    throw error;
  }
};

export const deleteOnCallShift = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/on-call/${id}`, { method: "DELETE" });
  } catch (error) {
    console.error("Erro deleteOnCallShift:", error);
  }
};

// --- SYSTEM USERS (USUÁRIOS DO SISTEMA) ---

export const getSystemUsers = async (): Promise<SystemUser[]> => {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Erro getSystemUsers:", error);
    return [];
  }
};

export const saveSystemUser = async (user: SystemUser): Promise<void> => {
  try {
    await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.error("Erro saveSystemUser:", error);
    throw error;
  }
};

export const deleteSystemUser = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
  } catch (error) {
    console.error("Erro deleteSystemUser:", error);
  }
};

// --- LOGS E OUTROS (PLACEHOLDERS) ---
// Estas funções mantêm a compatibilidade com o resto do sistema
// enquanto a API para logs não é implementada.

export const addSystemLog = async (log: SystemLog): Promise<void> => {
  // Apenas imprime no console por enquanto
  console.log("Log do Sistema:", log);
};

export const checkCoverage = (
  employeeId: string,
  role: string,
  squad: string,
  date: string,
  startTime: string,
  endTime: string
): boolean => {
  // Lógica de cobertura (Placeholder)
  // No futuro, aqui você fará um fetch para o backend validar se existe backup
  // Ex: await fetch(`${API_URL}/coverage/check`, ...)

  // Por enquanto retorna true (coberto) para não bloquear o uso
  return true;
};
