
import { Employee, Absence, ShiftChange, SystemUser, OnCallShift, SystemLog } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_ABSENCES } from '../constants';

// In a real application, these functions would be async fetch() calls to a Node/Postgres backend.
// Here we simulate persistence with localStorage.

const EMP_KEY = 'smart_time_employees_v2';
const ABS_KEY = 'smart_time_absences';
const SHIFT_CHANGE_KEY = 'smart_time_shift_changes';
const ON_CALL_KEY = 'smart_time_on_call_shifts';
const USERS_KEY = 'smart_time_system_users';
const LOGS_KEY = 'smart_time_system_logs';

// --- ENCRYPTION UTILITY ---
const CRYPTO_PREFIX = 'ENC_';

const encrypt = (text: string): string => {
  if (!text) return text;
  if (text.startsWith(CRYPTO_PREFIX)) return text;
  // Simple obfuscation: Reverse + Base64
  const encoded = btoa(encodeURIComponent(text).split('').reverse().join(''));
  return `${CRYPTO_PREFIX}${encoded}`;
};

const decrypt = (cipher: string): string => {
  if (!cipher || !cipher.startsWith(CRYPTO_PREFIX)) return cipher;
  try {
    const encoded = cipher.substring(CRYPTO_PREFIX.length);
    const decoded = decodeURIComponent(atob(encoded).split('').reverse().join(''));
    return decoded;
  } catch (e) {
    return cipher;
  }
};

// --- LOGGING SYSTEM ---

export const getSystemLogs = (): SystemLog[] => {
  const stored = localStorage.getItem(LOGS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const addSystemLog = (log: Omit<SystemLog, 'id' | 'timestamp'>): void => {
  const logs = getSystemLogs();
  const newLog: SystemLog = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    ...log
  };
  const updatedLogs = [newLog, ...logs].slice(0, 1000);
  localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
};

// --- EMPLOYEES ---

export const getEmployees = (): Employee[] => {
  const stored = localStorage.getItem(EMP_KEY);
  if (!stored) {
    localStorage.setItem(EMP_KEY, JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_EMPLOYEES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveEmployee = (employee: Employee, user?: string): void => {
  const employees = getEmployees();
  const existingIndex = employees.findIndex(e => String(e.id) === String(employee.id));
  
  if (existingIndex >= 0) {
    employees[existingIndex] = employee;
    addSystemLog({
        action: 'UPDATE',
        target: 'Funcionário',
        details: `Atualizou dados de ${employee.firstName} ${employee.lastName}`,
        performedBy: user || 'Sistema'
    });
  } else {
    employees.push(employee);
    addSystemLog({
        action: 'CREATE',
        target: 'Funcionário',
        details: `Criou funcionário ${employee.firstName} ${employee.lastName}`,
        performedBy: user || 'Sistema'
    });
  }
  localStorage.setItem(EMP_KEY, JSON.stringify(employees));
};

export const deleteEmployee = (id: string, adminName: string): void => {
  const employees = getEmployees();
  const empToDelete = employees.find(e => String(e.id) === String(id));
  if (!empToDelete) return;

  const updatedEmployees = employees.filter(e => String(e.id) !== String(id));
  localStorage.setItem(EMP_KEY, JSON.stringify(updatedEmployees));

  const absences = getAbsences();
  const remainingAbsences = absences.filter(a => a.employeeId !== id);
  localStorage.setItem(ABS_KEY, JSON.stringify(remainingAbsences));

  const changes = getShiftChanges();
  const remainingChanges = changes.filter(c => c.employeeId !== id);
  localStorage.setItem(SHIFT_CHANGE_KEY, JSON.stringify(remainingChanges));

  const onCalls = getOnCallShifts();
  const remainingOnCalls = onCalls.filter(o => o.employeeId !== id);
  localStorage.setItem(ON_CALL_KEY, JSON.stringify(remainingOnCalls));

  addSystemLog({
    action: 'DELETE',
    target: 'Funcionário',
    details: `Excluiu funcionário ${empToDelete.firstName} ${empToDelete.lastName} e registros vinculados.`,
    performedBy: adminName
  });
};

// --- ABSENCES ---

export const getAbsences = (): Absence[] => {
  const stored = localStorage.getItem(ABS_KEY);
  if (!stored) {
    localStorage.setItem(ABS_KEY, JSON.stringify(INITIAL_ABSENCES));
    return INITIAL_ABSENCES;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((a: any) => ({
      ...a,
      endDate: a.endDate || a.date
    }));
  } catch (e) {
    return [];
  }
};

export const saveAbsence = (absence: Absence): void => {
  const absences = getAbsences();
  const existingIndex = absences.findIndex(a => String(a.id) === String(absence.id));
  const isUpdate = existingIndex >= 0;

  if (isUpdate) {
    absences[existingIndex] = absence;
  } else {
    absences.push(absence);
  }
  localStorage.setItem(ABS_KEY, JSON.stringify(absences));
  
  const emp = getEmployees().find(e => e.id === absence.employeeId);
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Desconhecido';
  
  addSystemLog({
    action: isUpdate ? 'UPDATE' : 'CREATE',
    target: 'Ausência',
    details: `${isUpdate ? 'Editou' : 'Registrou'} ausência para ${empName}`,
    performedBy: absence.updatedBy || absence.createdBy || 'Sistema'
  });
};

export const deleteAbsence = (id: string, user?: string): void => {
  const absences = getAbsences();
  const updated = absences.filter(a => String(a.id) !== String(id));
  localStorage.setItem(ABS_KEY, JSON.stringify(updated));
};

// --- SHIFT CHANGES ---

export const getShiftChanges = (): ShiftChange[] => {
  const stored = localStorage.getItem(SHIFT_CHANGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveShiftChange = (change: ShiftChange): void => {
  const changes = getShiftChanges();
  const existingIndex = changes.findIndex(c => String(c.id) === String(change.id));
  const isUpdate = existingIndex >= 0;

  if (isUpdate) {
    changes[existingIndex] = change;
  } else {
    changes.push(change);
  }
  localStorage.setItem(SHIFT_CHANGE_KEY, JSON.stringify(changes));
};

export const deleteShiftChange = (id: string, user?: string): void => {
  const changes = getShiftChanges();
  const updated = changes.filter(c => String(c.id) !== String(id));
  localStorage.setItem(SHIFT_CHANGE_KEY, JSON.stringify(updated));
};

// --- ON CALL ---

export const getOnCallShifts = (): OnCallShift[] => {
  const stored = localStorage.getItem(ON_CALL_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveOnCallShift = (shift: OnCallShift): void => {
  const shifts = getOnCallShifts();
  const existingIndex = shifts.findIndex(s => String(s.id) === String(shift.id));
  if (existingIndex >= 0) {
    shifts[existingIndex] = shift;
  } else {
    shifts.push(shift);
  }
  localStorage.setItem(ON_CALL_KEY, JSON.stringify(shifts));
};

export const deleteOnCallShift = (id: string, user?: string): void => {
  const shifts = getOnCallShifts();
  const updated = shifts.filter(s => String(s.id) !== String(id));
  localStorage.setItem(ON_CALL_KEY, JSON.stringify(updated));
};


// --- SYSTEM USERS ---

const INITIAL_ADMIN: SystemUser = {
  id: 'admin-1',
  name: 'Administrador',
  email: 'adm.smarttime@ccmtecnologia.com.br',
  password: 'admin',
  isAdmin: true,
  mustChangePassword: false
};

export const getSystemUsers = (): SystemUser[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    const encryptedInitial = { ...INITIAL_ADMIN, password: encrypt(INITIAL_ADMIN.password) };
    localStorage.setItem(USERS_KEY, JSON.stringify([encryptedInitial]));
    return [INITIAL_ADMIN];
  }
  try {
    const rawUsers: SystemUser[] = JSON.parse(stored);
    return rawUsers.map(u => ({
      ...u,
      password: decrypt(u.password)
    }));
  } catch (e) {
    return [INITIAL_ADMIN];
  }
};

export const saveSystemUser = (user: SystemUser, performedBy?: string): void => {
  const users = getSystemUsers();
  const existingIndex = users.findIndex(u => String(u.id) === String(user.id));
  const isUpdate = existingIndex >= 0;

  if (user.id === 'admin-1') {
      user.isAdmin = true;
  }

  if (isUpdate) {
    users[existingIndex] = user;
  } else {
    user.mustChangePassword = true;
    users.push(user);
  }
  
  const encryptedUsers = users.map(u => ({
    ...u,
    password: encrypt(u.password)
  }));
  
  localStorage.setItem(USERS_KEY, JSON.stringify(encryptedUsers));

  addSystemLog({
    action: isUpdate ? 'UPDATE' : 'CREATE',
    target: 'Usuário',
    details: `${isUpdate ? 'Atualizou' : 'Criou'} usuário ${user.name}`,
    performedBy: performedBy || 'Sistema'
  });
};

export const deleteSystemUser = (id: string, performedBy?: string): void => {
  const users = getSystemUsers();
  if (id === 'admin-1') return;
  
  const updated = users.filter(u => String(u.id) !== String(id));
  const encryptedUsers = updated.map(u => ({
    ...u,
    password: encrypt(u.password)
  }));
  localStorage.setItem(USERS_KEY, JSON.stringify(encryptedUsers));
};

// --- Coverage Logic ---

export const checkCoverage = (employeeId: string, role: string, squad: string, date: string, startTime: string, endTime: string): boolean => {
  const employees = getEmployees();
  const absences = getAbsences();
  const peers = employees.filter(e => e.role === role && e.squad === squad && e.id !== employeeId);
  const shiftCoveringPeers = peers.filter(peer => peer.shiftStart <= startTime && peer.shiftEnd >= endTime);

  if (shiftCoveringPeers.length === 0) return false;

  const availablePeers = shiftCoveringPeers.filter(peer => {
    const peerAbsences = absences.filter(a => a.employeeId === peer.id);
    const hasConflict = peerAbsences.some(abs => {
      const isDateInAbsenceRange = date >= abs.date && date <= abs.endDate;
      if (!isDateInAbsenceRange) return false;
      return abs.startTime < endTime && startTime < abs.endTime;
    });
    return !hasConflict;
  });

  return availablePeers.length > 0;
};
