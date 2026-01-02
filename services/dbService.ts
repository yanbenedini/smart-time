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

// const API_URL = "http://163.176.231.117:5000"; -- PRODUÇÃO
const API_URL = "http://localhost:5000";

// --- LOGS DO SISTEMA ---

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

// Função auxiliar para gravar logs manuais (se necessário)
export const createLog = async (
  action: string,
  description: string,
  userName: string
) => {
  try {
    await fetch(`${API_URL}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-name": userName,
      },
      body: JSON.stringify({ action, description, userName }),
    });
  } catch (error) {
    console.error("Erro ao salvar log", error);
  }
};

// --- AUTENTICAÇÃO (LOGIN) ---
// Adicione esta função para corrigir o erro no Login.tsx

export const loginUser = async (email: string, password: string): Promise<SystemUser> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      // Tenta pegar a mensagem de erro do backend (ex: "Email ou senha inválidos")
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Falha na autenticação');
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no login:", error);
    throw error;
  }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ userId, currentPassword, newPassword })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao alterar a senha.');
    }
  } catch (error) {
    console.error("Erro changePassword:", error);
    throw error;
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
  userName: string
): Promise<Employee | null> => {
  try {
    const isEditing = employee.id && employee.id.length > 10;
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/employees/${employee.id}`
      : `${API_URL}/employees`;

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-user-name": userName,
      },
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
  userName: string
): Promise<void> => {
  try {
    await fetch(`${API_URL}/employees/${id}`, {
      method: "DELETE",
      headers: { "x-user-name": userName },
    });
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

export const saveAbsence = async (
  absence: Absence,
  userName: string
): Promise<void> => {
  try {
    const method = absence.id && absence.id.length > 10 ? "PUT" : "POST";
    const url =
      method === "PUT"
        ? `${API_URL}/absences/${absence.id}`
        : `${API_URL}/absences`;

    await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-user-name": userName,
      },
      body: JSON.stringify(absence),
    });
  } catch (error) {
    console.error("Erro saveAbsence:", error);
    throw error;
  }
};

export const deleteAbsence = async (
  id: string,
  userName: string
): Promise<void> => {
  try {
    await fetch(`${API_URL}/absences/${id}`, {
      method: "DELETE",
      headers: { "x-user-name": userName },
    });
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
  shiftChange: ShiftChange,
  userName: string
): Promise<void> => {
  try {
    await fetch(`${API_URL}/shift-changes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-name": userName,
      },
      body: JSON.stringify(shiftChange),
    });
  } catch (error) {
    console.error("Erro saveShiftChange:", error);
    throw error;
  }
};

export const deleteShiftChange = async (
  id: string,
  userName: string
): Promise<void> => {
  try {
    await fetch(`${API_URL}/shift-changes/${id}`, {
      method: "DELETE",
      headers: { "x-user-name": userName },
    });
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

export const saveOnCallShift = async (
  shift: OnCallShift,
  userName: string
): Promise<void> => {
  try {
    await fetch(`${API_URL}/on-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-name": userName,
      },
      body: JSON.stringify(shift),
    });
  } catch (error) {
    console.error("Erro saveOnCallShift:", error);
    throw error;
  }
};

export const deleteOnCallShift = async (
  id: string,
  userName: string
): Promise<void> => {
  try {
    await fetch(`${API_URL}/on-call/${id}`, {
      method: "DELETE",
      headers: { "x-user-name": userName },
    });
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

export const saveSystemUser = async (
  user: SystemUser,
  userName: string = "Sistema"
): Promise<void> => {
  try {
    // Se tem ID, é edição (PUT). Se não tem (string vazia), é criação (POST).
    const isEditing = user.id && user.id.length > 5; // Verificação simples de ID válido

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/users/${user.id}` : `${API_URL}/users`;

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-user-name": userName,
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      // Tenta ler a mensagem de erro do backend (ex: "Email já existe")
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao salvar usuário");
    }
  } catch (error) {
    console.error("Erro saveSystemUser:", error);
    throw error; // Repassa o erro para o componente mostrar o alerta vermelho
  }
};

export const deleteSystemUser = async (
  id: string,
  userName: string = "Sistema"
): Promise<void> => {
  try {
    await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: { "x-user-name": userName },
    });
  } catch (error) {
    console.error("Erro deleteSystemUser:", error);
  }
};

// --- LOGS E OUTROS ---

export const addSystemLog = async (log: SystemLog): Promise<void> => {
  // Mantido para compatibilidade, mas o ideal é usar createLog ou deixar o backend gerenciar
  console.log("Log do Sistema (Frontend):", log);
};

export const checkCoverage = (
  employeeId: string,
  role: string,
  squad: string,
  date: string,
  startTime: string,
  endTime: string
): boolean => {
  return true;
};