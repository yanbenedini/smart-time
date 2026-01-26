import React, { useState, useEffect } from "react";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  X,
  User,
  CalendarRange,
  CalendarDays,
  Trash2,
  Edit2,
  Search,
  Filter,
  UserCircle,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Employee,
  Absence,
  SystemUser,
  Role,
  Squad,
  ShiftChange,
} from "../types";
import {
  getEmployees,
  getAbsences,
  getShiftChanges,
  saveAbsence,
  deleteAbsence,
  checkCoverage,
} from "../services/dbService";
import { IonSkeletonText } from "@ionic/react";
import { formatDateBR } from "../utils/dateUtils";

type AbsenceType = "single" | "range" | "multi";

interface AbsenceManagerProps {
  currentUser: SystemUser;
}

const REASON_OPTIONS = [
  "Férias",
  "Banco de Horas",
  "Consulta médica",
  "Doente",
  "Passando mal",
  "Imprevisto pessoal",
];

const getSquadBadgeColor = (squad: Squad) => {
  switch (squad) {
    case Squad.LAKERS:
      return "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-500/60 dark:text-yellow-50 dark:border-yellow-600";
    case Squad.BULLS:
      return "bg-red-50 text-red-700 border-red-100 dark:bg-red-600/60 dark:text-red-50 dark:border-red-600";
    case Squad.WARRIORS:
      return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-600/60 dark:text-blue-50 dark:border-blue-600";
    case Squad.ROCKETS:
      return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-600/60 dark:text-purple-50 dark:border-purple-600";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-600/60 dark:text-slate-50 dark:border-slate-600/60";
  }
};

const AbsenceManager: React.FC<AbsenceManagerProps> = ({ currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [shiftChanges, setShiftChanges] = useState<ShiftChange[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: "",
    startDate: "",
    endDate: "",
    reason: "",
    squad: "",
    role: "",
  });

  // --- ESTADOS DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [absenceType, setAbsenceType] = useState<AbsenceType>("single");
  const [selectedEmpId, setSelectedEmpId] = useState("");

  // Date States
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [manualDates, setManualDates] = useState<string[]>([]);
  const [tempManualDate, setTempManualDate] = useState("");

  // Time States
  const [isFullDay, setIsFullDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Reason States
  const [reasonCategory, setReasonCategory] = useState(""); // Controls the dropdown
  const [reason, setReason] = useState(""); // The actual value saved
  const [observation, setObservation] = useState("");

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Warning Modal State (Coverage)
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [pendingAbsenceData, setPendingAbsenceData] = useState<any>(null);

  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);

  // --- DATA LOADING ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, abs, shifts] = await Promise.all([
        getEmployees(),
        getAbsences(),
        getShiftChanges(), // Carrega as trocas
      ]);
      setEmployees(emps);
      setAbsences(abs);
      setShiftChanges(shifts);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const getEffectiveShift = (empId: string, date: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return null;

    // Procura se existe uma troca de turno para este funcionário nesta data
    const change = shiftChanges.find(
      (c) => c.employeeId === empId && date >= c.startDate && date <= c.endDate
    );

    return {
      start: change ? change.newShiftStart : emp.shiftStart,
      end: change ? change.newShiftEnd : emp.shiftEnd,
      isChanged: !!change,
    };
  };

  // Resetar para a página 1 sempre que os filtros ou paginação mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // Filtering Logic
  const filteredAbsences = absences.filter((abs) => {
    const emp = employees.find((e) => e.id === abs.employeeId);

    const nameMatch = emp
      ? (emp.firstName + " " + emp.lastName)
        .toLowerCase()
        .includes(filters.employeeName.toLowerCase())
      : false;

    const reasonMatch = abs.reason
      .toLowerCase()
      .includes(filters.reason.toLowerCase());
    const squadMatch = filters.squad ? emp?.squad === filters.squad : true;
    const roleMatch = filters.role ? emp?.role === filters.role : true;

    let dateMatch = true;
    if (filters.startDate)
      dateMatch = dateMatch && abs.endDate >= filters.startDate;
    if (filters.endDate) dateMatch = dateMatch && abs.date <= filters.endDate;

    return nameMatch && reasonMatch && dateMatch && squadMatch && roleMatch;
  });

  // --- LÓGICA DE PAGINAÇÃO ---
  const totalItems = filteredAbsences.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Criamos a lista paginada respeitando a ordem reversa (mais novos primeiro)
  const paginatedAbsences = filteredAbsences
    .slice()
    .reverse()
    .slice(startIndex, startIndex + itemsPerPage);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () =>
    setFilters({
      employeeName: "",
      startDate: "",
      endDate: "",
      reason: "",
      squad: "",
      role: "",
    });

  // Reset times when employee changes (only if not editing)
  useEffect(() => {
    if (selectedEmpId && !editingId) {
      setStartTime("");
      setEndTime("");
      setIsFullDay(false);
    }
  }, [selectedEmpId]);

  const addManualDate = () => {
    if (!tempManualDate) return;
    if (!manualDates.includes(tempManualDate)) {
      setManualDates([...manualDates, tempManualDate].sort());
    }
    setTempManualDate("");
  };

  const removeManualDate = (dateToRemove: string) => {
    setManualDates(manualDates.filter((d) => d !== dateToRemove));
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const openNewModal = () => {
    setEditingId(null);
    setSelectedEmpId("");
    setReasonCategory("");
    setReason("");
    setObservation("");
    setDate("");
    setStartDate("");
    setEndDate("");
    setManualDates([]);
    setStartTime("");
    setEndTime("");
    setIsFullDay(false);
    setAbsenceType("single");
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (abs: Absence) => {
    setEditingId(abs.id);
    setSelectedEmpId(abs.employeeId);

    if (REASON_OPTIONS.includes(abs.reason)) {
      setReasonCategory(abs.reason);
      setReason(abs.reason);
    } else {
      setReasonCategory("Outros");
      setReason(abs.reason);
    }

    setObservation(abs.observation);

    const isRange = abs.date !== abs.endDate;

    if (isRange) {
      setAbsenceType("range");
      setStartDate(abs.date);
      setEndDate(abs.endDate);
      setDate("");
    } else {
      setAbsenceType("single");
      setDate(abs.date);
      setStartDate("");
      setEndDate("");
    }

    const emp = employees.find((e) => e.id === abs.employeeId);
    if (
      emp &&
      abs.startTime === emp.shiftStart &&
      abs.endTime === emp.shiftEnd
    ) {
      setIsFullDay(true);
      setStartTime("");
      setEndTime("");
    } else {
      setIsFullDay(false);
      setStartTime(abs.startTime);
      setEndTime(abs.endTime);
    }
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      try {
        await deleteAbsence(deleteConfirmationId, currentUser.name);
        await loadData();
        if (editingId === deleteConfirmationId) closeModal();
        setDeleteConfirmationId(null);
      } catch (err) {
        alert("Erro ao excluir ausência.");
      }
    }
  };

  const executeSave = async (absenceData: any) => {
    const {
      absenceType,
      startDate,
      endDate,
      date,
      manualDates,
      emp,
      finalStartTime,
      finalEndTime,
      finalDuration,
      reason,
      observation,
    } = absenceData;

    const commonData = {
      employeeId: emp.id,
      reason,
      startTime: finalStartTime,
      endTime: finalEndTime,
      durationMinutes: finalDuration,
      observation,
      approved: true,
    };

    try {
      if (editingId) {
        const existing = absences.find((a) => a.id === editingId);

        let updateDate = date;
        let updateEndDate = date;

        if (absenceType === "range") {
          updateDate = startDate;
          updateEndDate = endDate;
        }

        const updatedAbsence: Absence = {
          id: editingId,
          ...commonData,
          date: updateDate,
          endDate: updateEndDate,
          createdBy: existing?.createdBy,
          createdAt: existing?.createdAt,
          updatedBy: currentUser.name,
          updatedAt: new Date().toISOString(),
        };

        await saveAbsence(updatedAbsence, currentUser.name);
      } else {
        const auditInfo = {
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
        };

        const newAbsences: Absence[] = [];

        if (absenceType === "range") {
          newAbsences.push({
            id: "",
            ...commonData,
            ...auditInfo,
            date: startDate,
            endDate: endDate,
          });
        } else if (absenceType === "single") {
          newAbsences.push({
            id: "",
            ...commonData,
            ...auditInfo,
            date: date,
            endDate: date,
          });
        } else if (absenceType === "multi") {
          manualDates.forEach((d: string) => {
            newAbsences.push({
              id: "",
              ...commonData,
              ...auditInfo,
              date: d,
              endDate: d,
            });
          });
        }

        await Promise.all(
          newAbsences.map((abs) => saveAbsence(abs, currentUser.name))
        );
      }

      await loadData();
      setWarningModalOpen(false);
      setPendingAbsenceData(null);
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar os dados. Tente novamente.");
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) return;

    if (!reason || reason.trim() === "") {
      setError("Por favor, informe o motivo da ausência.");
      return;
    }

    // --- INÍCIO DA MUDANÇA 1: Movendo o cálculo de datas para o topo ---
    let targetDates: string[] = [];

    if (absenceType === "single") {
      if (!date) {
        setError("Selecione uma data.");
        return;
      }
      targetDates = [date];
    } else if (absenceType === "range") {
      if (!startDate || !endDate) {
        setError("Selecione data de início e fim.");
        return;
      }
      if (startDate > endDate) {
        setError("A data de início deve ser anterior à data fim.");
        return;
      }

      let current = new Date(startDate + "T12:00:00");
      const end = new Date(endDate + "T12:00:00");
      while (current <= end) {
        targetDates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    } else if (absenceType === "multi") {
      if (manualDates.length === 0) {
        setError("Adicione pelo menos uma data.");
        return;
      }
      targetDates = manualDates;
    }
    // --- FIM DA MUDANÇA 1 ---

    // --- INÍCIO DA MUDANÇA 2: Definindo horários com base no Horário Efetivo (Troca ou Normal) ---
    // Pegamos o expediente do primeiro dia da ausência para basear a validação
    const firstDayShift = getEffectiveShift(emp.id, targetDates[0]);

    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (isFullDay) {
      // Se for dia inteiro, o horário vem do expediente ativo (seja troca ou original)
      finalStartTime = firstDayShift.start;
      finalEndTime = firstDayShift.end;
    } else {
      if (!finalStartTime || !finalEndTime) {
        setError("Os campos Hora Início e Hora Fim são obrigatórios.");
        return;
      }

      // Validação em todos os dias selecionados para garantir que cabe em cada expediente
      for (const d of targetDates) {
        const dailyShift = getEffectiveShift(emp.id, d);
        if (
          finalStartTime < dailyShift.start ||
          finalEndTime > dailyShift.end
        ) {
          setError(
            `No dia ${d}, o horário solicitado está fora do expediente ativo (${dailyShift.start} às ${dailyShift.end}).`
          );
          return;
        }
      }

      if (finalStartTime >= finalEndTime) {
        setError("A Hora Fim deve ser posterior à Hora Início.");
        return;
      }
    }
    // --- FIM DA MUDANÇA 2 ---

    const startMins = timeToMinutes(finalStartTime);
    const endMins = timeToMinutes(finalEndTime);
    const finalDuration = endMins - startMins;

    const dataToSave = {
      absenceType,
      targetDates,
      date,
      startDate,
      endDate,
      manualDates,
      emp,
      finalStartTime,
      finalEndTime,
      finalDuration,
      reason,
      observation,
    };

    let missingCoverageDates: string[] = [];

    // --- INÍCIO DA MUDANÇA 3: Lógica de Cobertura com Horário Exato e Trocas de Colegas ---
    for (const d of targetDates) {
      // Qual o horário que o funcionário que vai faltar está fazendo nesse dia específico?
      const currentEmpShift = getEffectiveShift(emp.id, d);

      // Busca colegas da mesma squad e cargo
      const peers = employees.filter(
        (p) => p.id !== emp.id && p.role === emp.role && p.squad === emp.squad
      );

      // REGRA: O backup deve ter o expediente EXATAMENTE IGUAL ao do ausente no dia
      const hasExactBackup = peers.some((p) => {
        const peerShift = getEffectiveShift(p.id, d);
        return (
          peerShift.start === currentEmpShift.start &&
          peerShift.end === currentEmpShift.end
        );
      });

      if (!hasExactBackup) {
        // Formata data para exibir no erro (DD/MM/YYYY)
        const [y, m, day] = d.split("-");
        missingCoverageDates.push(`${day}/${m}/${y}`);
      }
    }
    // --- FIM DA MUDANÇA 3 ---

    if (missingCoverageDates.length > 0) {
      // --- INÍCIO DA MUDANÇA 4: Mensagem de erro atualizada para "Expediente Exato" ---
      setWarningMessage(
        `Atenção: Não há outro funcionário com o expediente exato (${finalStartTime} - ${finalEndTime}) na Squad "${emp.squad
        }" para as seguintes datas: ${missingCoverageDates.join(", ")}.`
      );
      // --- FIM DA MUDANÇA 4 ---
      setPendingAbsenceData(dataToSave);
      setWarningModalOpen(true);
      return;
    }

    await executeSave(dataToSave);
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const escapeCsv = (str: string | undefined | null) => {
    if (!str) return '""';
    const stringValue = String(str);
    if (
      stringValue.includes(";") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleExportCSV = () => {
    if (filteredAbsences.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = [
      "Funcionário",
      "Cargo",
      "Motivo",
      "Data Início",
      "Data Fim",
      "Hora Início",
      "Hora Fim",
      "Duração (min)",
      "Observação",
      "Registrado Por",
      "Data Registro",
      "Atualizado Por",
      "Data Atualização",
    ];

    const rows = filteredAbsences.map((abs) => {
      const emp = employees.find((e) => e.id === abs.employeeId);
      return [
        escapeCsv(emp ? `${emp.firstName} ${emp.lastName}` : "Desconhecido"),
        escapeCsv(emp?.role),
        escapeCsv(abs.reason),
        escapeCsv(abs.date),
        escapeCsv(abs.endDate),
        escapeCsv(abs.startTime),
        escapeCsv(abs.endTime),
        escapeCsv(String(abs.durationMinutes)),
        escapeCsv(abs.observation),
        escapeCsv(abs.createdBy),
        escapeCsv(abs.createdAt),
        escapeCsv(abs.updatedBy),
        escapeCsv(abs.updatedAt),
      ];
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `ausencias_smarttime_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lógica para pegar o expediente dinâmico para exibição na tela
  const currentDisplayShift = (() => {
    if (!selectedEmpId) return null;

    // Define qual data usar para a consulta baseada no tipo de ausência
    let dateToConsult = "";
    if (absenceType === "single") dateToConsult = date;
    else if (absenceType === "range") dateToConsult = startDate;
    else if (absenceType === "multi") dateToConsult = manualDates[0];

    if (!dateToConsult) return null;

    return getEffectiveShift(selectedEmpId, dateToConsult);
  })();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">
            Controle de Ausências
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Registre saídas antecipadas, faltas ou férias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 relative w-full md:w-auto">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm border ${isFilterOpen || activeFilterCount > 0
              ? "bg-[#204294]/10 border-[#204294]/20 text-[#204294] dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
              : "bg-white border-slate-200 text-[#3F3F3F] hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
          >
            <Filter size={18} />

            {activeFilterCount > 0 && (
              <span className="bg-[#204294] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-[#3F3F3F] px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Exportar para CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={openNewModal}
            className="flex-1 md:flex-none bg-[#204294] hover:bg-[#1a367a] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-bold"
            title="Adicionar Ausência"
          >
            <Plus size={18} />
          </button>

          {/* Filter Dropdown Panel */}
          {isFilterOpen && (
            <div className="absolute top-12 right-0 w-full md:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-20 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#1E1E1E] flex items-center gap-2 dark:text-white">
                  <Search size={16} /> Filtros
                </h3>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#3F3F3F] mb-1 block dark:text-slate-300">
                    Nome do Funcionário
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                    value={filters.employeeName}
                    onChange={(e) =>
                      setFilters({ ...filters, employeeName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3F3F3F] mb-1 block dark:text-slate-300">
                    Motivo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Férias, Médico..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                    value={filters.reason}
                    onChange={(e) =>
                      setFilters({ ...filters, reason: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block dark:text-slate-300">
                      Data Início
                    </label>
                    <input
                      type="date"
                      className="dark:[color-scheme:dark] w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block dark:text-slate-300">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      className="dark:[color-scheme:dark] w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block dark:text-slate-300">
                      Squad
                    </label>
                    <select
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      value={filters.squad}
                      onChange={(e) =>
                        setFilters({ ...filters, squad: e.target.value })
                      }
                    >
                      <option value="">Todas</option>
                      {Object.values(Squad).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block dark:text-slate-300">
                      Cargo
                    </label>
                    <select
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      value={filters.role}
                      onChange={(e) =>
                        setFilters({ ...filters, role: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      {Object.values(Role).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- SELETOR DE ITENS POR PÁGINA --- */}
      <div className="flex justify-end">
        <div className="p-2 px-3 rounded-xl flex items-center w-fit">
          <div className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap dark:text-slate-400">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-[#204294] bg-white font-medium text-[#204294] cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>por página</span>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center dark:bg-slate-700/50 dark:border-slate-700">
          <h3 className="font-semibold text-slate-700 dark:text-white">
            Histórico de Registros
          </h3>
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-300">
            Total: {totalItems}
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`sk-abs-${i}`} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:w-1/3">
                    <div className="min-w-10 min-h-10 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <div className="flex-1">
                      <IonSkeletonText
                        animated
                        style={{ width: "120px", height: "12px" }}
                      />
                      <IonSkeletonText
                        animated
                        style={{
                          width: "180px",
                          height: "10px",
                          marginTop: "6px",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <IonSkeletonText
                      animated
                      style={{ width: "150px", height: "14px" }}
                    />
                  </div>
                  <div className="md:justify-end">
                    <div className="min-w-8 min-h-8 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedAbsences.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar size={32} />
            </div>
            <p>Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginatedAbsences.map((abs) => {
              const emp = employees.find((e) => e.id === abs.employeeId);
              const isRange = abs.date !== abs.endDate;
              const auditUser = abs.updatedBy || abs.createdBy || "Sistema";
              const auditDate = abs.updatedAt || abs.createdAt;
              const auditLabel = abs.updatedBy
                ? "Atualizado por"
                : "Registrado por";

              return (
                <div
                  key={abs.id}
                  onClick={() => handleEdit(abs)}
                  // group transition-all duration-200 hover:bg-[#204294]/5 cursor-pointer dark:hover:bg-slate-700/50
                  className="p-4 hover:bg-[#204294]/5 transition-all duration-200 cursor-pointer group dark:hover:bg-slate-700/50"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:w-1/3">
                      <div className="min-w-10 min-h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1E1E1E] font-bold text-sm dark:bg-slate-700 dark:text-white">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-[#1E1E1E] flex items-center gap-2 dark:text-white dark:group-hover:text-blue-400">
                          {emp
                            ? `${emp.firstName} ${emp.lastName}`
                            : "Funcionário removido"}
                          {emp && (
                            <span
                              className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${getSquadBadgeColor(
                                emp.squad
                              )}`}
                            >
                              {emp.squad}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {emp?.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {abs.reason}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {isRange ? (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-sm font-medium w-fit text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                            <CalendarRange size={12} /> {formatDateBR(abs.date)}{" "}
                            <span className="text-slate-400">até</span>{" "}
                            {formatDateBR(abs.endDate)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-sm font-medium w-fit text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                            <Calendar size={12} /> {formatDateBR(abs.date)}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock size={12} /> {abs.startTime} - {abs.endTime}
                        </div>
                        {abs.observation && (
                          <span className="text-slate-400 italic truncate max-w-[200px]">
                            "{abs.observation}"
                          </span>
                        )}
                      </div>
                      {auditDate && (
                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 border-t border-slate-100 dark:border-slate-700 pt-1 w-full md:w-auto">
                          <UserCircle size={10} />
                          <span>
                            {auditLabel} <strong>{auditUser}</strong> em{" "}
                            {formatDateTime(auditDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 md:justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(abs.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition duration-200 dark:text-slate-500 dark:hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- RODAPÉ DE PAGINAÇÃO --- */}
        {!isLoading && totalItems > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 dark:bg-slate-800 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando{" "}
              <span className="font-bold text-slate-800 dark:text-white">{startIndex + 1}</span>{" "}
              a <span className="font-bold text-slate-800 dark:text-white">{endIndex}</span> de{" "}
              <span className="font-bold text-slate-800 dark:text-white">{totalItems}</span>{" "}
              registros
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-500 dark:text-slate-400">Página</span>
                <span className="text-sm font-bold text-[#204294] bg-[#204294]/10 px-2 py-1 rounded border border-[#204294]/20 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800">
                  {currentPage}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">de {totalPages}</span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <ChevronRight size={18} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 dark:bg-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center gap-2 dark:text-white">
                  {editingId ? (
                    <Edit2 size={18} className="text-[#204294] dark:text-blue-400" />
                  ) : (
                    <Plus size={18} className="text-[#204294] dark:text-blue-400" />
                  )}
                  {editingId ? "Editar Ausência" : "Nova Ausência"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Preencha os dados da ocorrência.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleRequest} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Funcionário <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!!editingId}
                    className={`w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500 ${editingId ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : ""
                      }`}
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                      Tipo de Ausência <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-lg dark:bg-slate-700">
                      <button
                        type="button"
                        onClick={() => setAbsenceType("single")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${absenceType === "single"
                          ? "dark:bg-slate-800 dark:text-white bg-white text-[#204294] shadow-sm"
                          : "dark:bg-slate-700 dark:text-slate-300 text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                          }`}
                      >
                        <Calendar size={16} /> Dia Único
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbsenceType("range")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${absenceType === "range"
                          ? "dark:bg-slate-800 dark:text-white bg-white text-[#204294] shadow-sm"
                          : "dark:bg-slate-700 dark:text-slate-300 text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                          }`}
                      >
                        <CalendarRange size={16} /> Período
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbsenceType("multi")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${absenceType === "multi"
                          ? "dark:bg-slate-800 dark:text-white bg-white text-[#204294] shadow-sm"
                          : "dark:bg-slate-700 dark:text-slate-300 text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                          }`}
                      >
                        <CalendarDays size={16} /> Dias
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700">
                  {absenceType === "single" && (
                    <input
                      required
                      type="date"
                      className="dark:text-white dark:[color-scheme:dark] w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:focus:border-blue-500"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  )}
                  {absenceType === "range" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">
                          Início
                        </label>
                        <input
                          required
                          type="date"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">
                          Fim
                        </label>
                        <input
                          required
                          type="date"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {absenceType === "multi" && (
                    <div>
                      {editingId ? (
                        <div className="text-sm text-rose-500">
                          Edição em lote não suportada.
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 mb-3">
                            <input
                              type="date"
                              className="flex-1 border border-slate-300 rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                              value={tempManualDate}
                              onChange={(e) =>
                                setTempManualDate(e.target.value)
                              }
                            />
                            <button
                              type="button"
                              onClick={addManualDate}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 rounded-lg dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {manualDates.map((d) => (
                              <span
                                key={d}
                                className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-md text-sm text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                              >
                                {d}{" "}
                                <button
                                  type="button"
                                  onClick={() => removeManualDate(d)}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {currentDisplayShift && (
                  <div className="mt-2 animate-in fade-in duration-300">
                    <p className="dark:text-slate-300 text-xs text-[#204294] font-bold bg-[#204294]/10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#204294]/20">
                      <Clock size={12} />
                      Expediente: {currentDisplayShift.start} às{" "}
                      {currentDisplayShift.end}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Horário
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isFullDay}
                        onChange={(e) => setIsFullDay(e.target.checked)}
                        className=" w-4 h-4 text-[#204294] rounded focus:ring-[#204294]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Dia Inteiro
                      </span>
                    </label>
                  </div>
                  {!isFullDay ? (
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        required
                        type="time"
                        className="dark:[color-scheme:dark] w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                      <input
                        required
                        type="time"
                        className="dark:[color-scheme:dark] w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="dark:text-slate-300 bg-[#204294]/10 border border-[#204294]/20 rounded-lg p-3 text-sm text-[#204294] flex gap-2">
                      <Clock size={18} className="flex-shrink-0" />
                      <p>
                        Período:{" "}
                        <strong>{currentDisplayShift?.start || "--:--"}</strong>{" "}
                        às{" "}
                        <strong>{currentDisplayShift?.end || "--:--"}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Motivo <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:border-blue-500"
                    value={reasonCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReasonCategory(val);
                      if (val !== "Outros") setReason(val);
                      else setReason("");
                    }}
                  >
                    <option value="">Selecione...</option>
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {reasonCategory === "Outros" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Detalhe o motivo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Descreva..."
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Observação{" "}
                    <span className="text-xs text-slate-400">(Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:border-blue-500"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                  ></textarea>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl dark:bg-slate-800 dark:border-slate-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium dark:text-slate-300 dark:hover:bg-slate-700 transition duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequest}
                className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] shadow-sm font-bold dark:bg-blue-600 dark:hover:bg-blue-700 transition duration-150"
              >
                {editingId ? "Salvar Alterações" : "Registrar Ausência"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Confirmation Modal */}
      {warningModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center animate-in zoom-in duration-200 dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">
              Conflito de Escala
            </h3>
            <p className="text-slate-600 mb-6 text-sm dark:text-slate-300">{warningMessage}</p>
            <p className="text-slate-500 mb-6 text-sm font-medium dark:text-slate-400">
              Deseja prosseguir mesmo assim?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setWarningModalOpen(false);
                  setPendingAbsenceData(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 font-medium dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Voltar
              </button>
              <button
                onClick={() => executeSave(pendingAbsenceData)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Sim, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center dark:bg-slate-800">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">
              Excluir Ausência?
            </h3>
            <p className="text-slate-500 mb-6 text-sm dark:text-slate-400">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium dark:bg-rose-600 dark:hover:bg-rose-700"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceManager;
