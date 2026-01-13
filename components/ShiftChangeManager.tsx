import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  AlertTriangle,
  X,
  UserCircle,
  Download,
  User,
  Upload,
  Search,
  Filter,
  FileText,
  CheckCircle,
  FileWarning,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Employee, ShiftChange, SystemUser, Role, Squad } from "../types";
import {
  getEmployees,
  getShiftChanges,
  saveShiftChange,
  deleteShiftChange,
} from "../services/dbService";
import { IonSkeletonText } from "@ionic/react";

interface ShiftChangeManagerProps {
  currentUser: SystemUser;
}

const getSquadBadgeColor = (squad: Squad) => {
  switch (squad) {
    case Squad.LAKERS:
      return "bg-yellow-50 text-yellow-700 border-yellow-100";
    case Squad.BULLS:
      return "bg-red-50 text-red-700 border-red-100";
    case Squad.WARRIORS:
      return "bg-blue-50 text-blue-700 border-blue-100";
    case Squad.ROCKETS:
      return "bg-purple-50 text-purple-700 border-purple-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

const ShiftChangeManager: React.FC<ShiftChangeManagerProps> = ({
  currentUser,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [changes, setChanges] = useState<ShiftChange[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: "",
    startDate: "",
    endDate: "",
    squad: "",
    role: "",
    newShiftStart: "",
    newShiftEnd: "",
  });

  // --- ESTADOS DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    success: number;
    errors: number;
    details: string[];
  } | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState("");

  // Form Fields
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [originalShiftStart, setOriginalShiftStart] = useState("");
  const [originalShiftEnd, setOriginalShiftEnd] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("");
  const [newShiftEnd, setNewShiftEnd] = useState("");
  const [reason, setReason] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);

  const [isLoading, setIsLoading] = useState(true);

  // --- DATA LOADING ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, shiftData] = await Promise.all([
        getEmployees(),
        getShiftChanges(),
      ]);
      setEmployees(emps);
      setChanges(shiftData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Resetar para a página 1 sempre que os filtros ou paginação mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // Auto-fill original shift when employee is selected
  useEffect(() => {
    if (selectedEmpId && !editingId) {
      const emp = employees.find((e) => e.id === selectedEmpId);
      if (emp) {
        setOriginalShiftStart(emp.shiftStart);
        setOriginalShiftEnd(emp.shiftEnd);
      }
    }
  }, [selectedEmpId, employees, editingId]);

  // Filtering Logic
  const filteredChanges = changes.filter((c) => {
    const emp = employees.find((e) => e.id === c.employeeId);

    const nameMatch = emp
      ? (emp.firstName + " " + emp.lastName)
          .toLowerCase()
          .includes(filters.employeeName.toLowerCase())
      : false;

    const squadMatch = filters.squad ? emp?.squad === filters.squad : true;
    const roleMatch = filters.role ? emp?.role === filters.role : true;

    // Filtro por Novo Horário (Início e Fim)
    const startTimeMatch = filters.newShiftStart
      ? c.newShiftStart === filters.newShiftStart
      : true;
    const endTimeMatch = filters.newShiftEnd
      ? c.newShiftEnd === filters.newShiftEnd
      : true;

    let dateMatch = true;
    if (filters.startDate)
      dateMatch = dateMatch && c.endDate >= filters.startDate;
    if (filters.endDate)
      dateMatch = dateMatch && c.startDate <= filters.endDate;

    return (
      nameMatch &&
      dateMatch &&
      squadMatch &&
      roleMatch &&
      startTimeMatch &&
      endTimeMatch
    );
  });

  // --- LÓGICA DE PAGINAÇÃO ---
  const totalItems = filteredChanges.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedChanges = filteredChanges
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(startIndex, startIndex + itemsPerPage);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () =>
    setFilters({
      employeeName: "",
      startDate: "",
      endDate: "",
      squad: "",
      role: "",
      newShiftStart: "",
      newShiftEnd: "",
    });

  const openNewModal = () => {
    setEditingId(null);
    setSelectedEmpId("");
    setStartDate("");
    setEndDate("");
    setOriginalShiftStart("");
    setOriginalShiftEnd("");
    setNewShiftStart("");
    setNewShiftEnd("");
    setReason("");
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (change: ShiftChange) => {
    setEditingId(change.id);
    setSelectedEmpId(change.employeeId);
    setStartDate(change.startDate);
    setEndDate(change.endDate);
    setOriginalShiftStart(change.originalShiftStart);
    setOriginalShiftEnd(change.originalShiftEnd);
    setNewShiftStart(change.newShiftStart);
    setNewShiftEnd(change.newShiftEnd);
    setReason(change.reason);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (
      !selectedEmpId ||
      !startDate ||
      !endDate ||
      !newShiftStart ||
      !newShiftEnd ||
      !reason
    ) {
      setError("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    if (startDate > endDate) {
      setError("A data final deve ser igual ou posterior à data inicial.");
      return;
    }

    const existing = editingId ? changes.find((c) => c.id === editingId) : null;

    const newChange: ShiftChange = {
      id: editingId || "",
      employeeId: selectedEmpId,
      originalShiftStart,
      originalShiftEnd,
      newShiftStart,
      newShiftEnd,
      startDate,
      endDate,
      reason,
      createdBy: existing?.createdBy || currentUser.name,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedBy: existing ? currentUser.name : undefined,
      updatedAt: existing ? new Date().toISOString() : undefined,
    };

    try {
      await saveShiftChange(newChange, currentUser.name);
      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar troca de turno. Tente novamente.");
    }
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      try {
        await deleteShiftChange(deleteConfirmationId, currentUser.name);
        await loadData();
        if (editingId === deleteConfirmationId) closeModal();
        setDeleteConfirmationId(null);
      } catch (err) {
        alert("Erro ao excluir troca de turno.");
      }
    }
  };

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
    if (filteredChanges.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = [
      "Funcionário",
      "Matrícula",
      "Data Início",
      "Data Fim",
      "Turno Original Início",
      "Turno Original Fim",
      "Novo Turno Início",
      "Novo Turno Fim",
      "Motivo",
      "Registrado Por",
      "Data Registro",
      "Atualizado Por",
      "Data Atualização",
    ];

    const rows = filteredChanges.map((c) => {
      const emp = employees.find((e) => e.id === c.employeeId);
      return [
        escapeCsv(emp ? `${emp.firstName} ${emp.lastName}` : "Desconhecido"),
        escapeCsv(emp ? emp.matricula : ""),
        escapeCsv(c.startDate),
        escapeCsv(c.endDate),
        escapeCsv(c.originalShiftStart),
        escapeCsv(c.originalShiftEnd),
        escapeCsv(c.newShiftStart),
        escapeCsv(c.newShiftEnd),
        escapeCsv(c.reason),
        escapeCsv(c.createdBy),
        escapeCsv(c.createdAt),
        escapeCsv(c.updatedBy),
        escapeCsv(c.updatedAt),
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
      `trocas_turno_smarttime_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Matrícula",
      "DataInicio",
      "DataFim",
      "NovoInicio",
      "NovoFim",
      "Motivo",
    ];
    const exampleRow1 = [
      "1001",
      "2023-12-25",
      "2023-12-25",
      "14:00",
      "22:00",
      "Troca com colega",
    ];
    const exampleRow2 = [
      "1002",
      "2023-12-31",
      "2024-01-01",
      "18:00",
      "02:00",
      "Necessidade pessoal",
    ];

    const csvContent = [
      headers.join(";"),
      exampleRow1.join(";"),
      exampleRow2.join(";"),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `template_importacao_trocas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    setImportFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const csvText = evt.target?.result as string;
      if (csvText) {
        if (csvText.includes("\uFFFD")) {
          console.log(
            "Encoding: Problema detectado com UTF-8. Tentando ISO-8859-1 (ANSI)..."
          );
          const retryReader = new FileReader();
          retryReader.onload = (retryEvt) => {
            const retryText = retryEvt.target?.result as string;
            processCSV(retryText);
          };
          retryReader.readAsText(file, "ISO-8859-1");
        } else {
          processCSV(csvText);
        }
      }
    };

    reader.onerror = () => {
      alert("Erro ao ler o arquivo.");
    };

    reader.readAsText(file);
  };

  const processCSV = async (csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/);
      let importedCount = 0;
      let errorCount = 0;
      let errorsDetails: string[] = [];

      const currentEmployees = await getEmployees();
      const promises = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(";").map((c) => c.trim().replace(/^"|"$/g, ""));

        if (cols.length >= 6) {
          const [matricula, dStart, dEnd, nStart, nEnd, reasonImport] = cols;

          const emp = currentEmployees.find((e) => e.matricula === matricula);
          if (!emp) {
            errorCount++;
            errorsDetails.push(
              `Linha ${i + 1}: Matrícula '${matricula}' não encontrada.`
            );
            continue;
          }

          const newChange: ShiftChange = {
            id: "",
            employeeId: emp.id,
            originalShiftStart: emp.shiftStart,
            originalShiftEnd: emp.shiftEnd,
            newShiftStart: nStart,
            newShiftEnd: nEnd,
            startDate: dStart,
            endDate: dEnd,
            reason: reasonImport || "Importado via CSV",
            createdBy: currentUser.name + " (Import)",
            createdAt: new Date().toISOString(),
          };

          promises.push(saveShiftChange(newChange, currentUser.name));
          importedCount++;
        } else {
          errorCount++;
          errorsDetails.push(`Linha ${i + 1}: Colunas insuficientes.`);
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      await loadData();
      setImportFeedback({
        success: importedCount,
        errors: errorCount,
        details: errorsDetails,
      });
    } catch (err) {
      console.error("Critical CSV processing error:", err);
      setImportFeedback({
        success: 0,
        errors: 1,
        details: ["Erro crítico no processamento do CSV."],
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E]">Trocas de Turno</h1>
          <p className="text-slate-500">
            Gerencie alterações temporárias de horário.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 relative w-full md:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm border ${
              isFilterOpen || activeFilterCount > 0
                ? "bg-[#204294]/10 border-[#204294]/20 text-[#204294]"
                : "bg-white border-slate-200 text-[#3F3F3F] hover:bg-slate-50"
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
            className="flex-1 md:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-[#3F3F3F] px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-medium"
            title="Exportar para CSV"
          >
            <Download size={18} />
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="flex-1 md:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-[#3F3F3F] px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-medium"
            title="Baixar Modelo de Importação"
          >
            <FileText size={18} />
          </button>

          <button
            onClick={handleImportClick}
            className="flex-1 md:flex-none bg-[#01B8A1] hover:bg-[#019f8b] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-medium"
            title="Importar CSV"
          >
            <Upload size={18} />
          </button>

          <button
            onClick={openNewModal}
            className="flex-1 md:flex-none bg-[#204294] hover:bg-[#1a367a] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-bold"
            title="Adicionar Troca"
          >
            <Plus size={18} />
          </button>

          {/* Filter Dropdown Panel */}
          {isFilterOpen && (
            <div className="absolute top-12 right-0 w-full md:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#1E1E1E] flex items-center gap-2">
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
                  <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                    Nome do Funcionário
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                    value={filters.employeeName}
                    onChange={(e) =>
                      setFilters({ ...filters, employeeName: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Data Início
                    </label>
                    <input
                      type="date"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Squad
                    </label>
                    <select
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
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
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Cargo
                    </label>
                    <select
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
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
                {/* Novos Filtros: Novo Horário (Início e Fim) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Novo Início
                    </label>
                    <input
                      type="time"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                      value={filters.newShiftStart}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          newShiftStart: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Novo Fim
                    </label>
                    <input
                      type="time"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                      value={filters.newShiftEnd}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          newShiftEnd: e.target.value,
                        })
                      }
                    />
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

      {/* --- SELETOR DE ITENS POR PÁGINA (Alinhado à direita) --- */}
      <div className="flex justify-end">
        <div className="p-2 px-3 rounded-xl flex items-center w-fit">
          <div className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-[#204294] bg-white font-medium text-[#204294] cursor-pointer"
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
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden mb-20">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Histórico de Trocas</h3>
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            Total: {totalItems}
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-shift-${i}`} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:w-1/3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                    <div className="flex-1">
                      <IonSkeletonText
                        animated
                        style={{ width: "130px", height: "12px" }}
                      />
                      <IonSkeletonText
                        animated
                        style={{
                          width: "100px",
                          height: "10px",
                          marginTop: "6px",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <IonSkeletonText
                      animated
                      style={{ width: "160px", height: "20px" }}
                    />
                    <div className="flex gap-4">
                      <IonSkeletonText
                        animated
                        style={{ width: "100px", height: "14px" }}
                      />
                      <IonSkeletonText
                        animated
                        style={{ width: "100px", height: "14px" }}
                      />
                    </div>
                  </div>
                  <div className="md:justify-end">
                    <div className="w-8 h-8 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedChanges.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <ArrowLeftRight size={32} />
            </div>
            <p>Nenhuma troca encontrada com os filtros selecionados.</p>
            {changes.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-[#204294] font-medium hover:underline mt-2"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedChanges.map((change) => {
              const emp = employees.find((e) => e.id === change.employeeId);
              const auditUser =
                change.updatedBy || change.createdBy || "Sistema";
              const auditDate = change.updatedAt || change.createdAt;
              const auditLabel = change.updatedBy
                ? "Atualizado por"
                : "Registrado por";

              return (
                <div
                  key={change.id}
                  onClick={() => handleEdit(change)}
                  className="p-4 hover:bg-[#204294]/5 transition-colors duration-200 cursor-pointer group hover:shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:w-1/3">
                      <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1E1E1E] font-bold group-hover:bg-[#204294] group-hover:text-white transition-colors">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-[#1E1E1E] flex items-center gap-2">
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
                        <div className="text-xs text-slate-500">
                          {emp?.role}
                        </div>
                        {emp && (
                          <span
                            className={`sm:hidden inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${getSquadBadgeColor(
                              emp.squad
                            )}`}
                          >
                            {emp.squad}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-1 bg-[#204294]/10 px-2 py-0.5 rounded border border-[#204294]/20 text-[#204294] text-sm font-medium w-fit">
                        <Calendar size={14} />
                        {change.startDate === change.endDate
                          ? change.startDate
                          : `${change.startDate} até ${change.endDate}`}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-400 line-through flex items-center gap-1">
                          <Clock size={12} /> {change.originalShiftStart} -{" "}
                          {change.originalShiftEnd}
                        </span>
                        <ArrowRight size={14} className="text-[#204294]" />
                        <span className="text-slate-700 font-bold flex items-center gap-1">
                          <Clock size={12} /> {change.newShiftStart} -{" "}
                          {change.newShiftEnd}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 italic">
                        "{change.reason}"
                      </div>
                      {auditDate && (
                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 border-t border-slate-100 pt-1 w-full md:w-auto">
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
                          requestDelete(change.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-bold text-slate-800">{startIndex + 1}</span>{" "}
              a <span className="font-bold text-slate-800">{endIndex}</span> de{" "}
              <span className="font-bold text-slate-800">{totalItems}</span>{" "}
              registros
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} className="text-slate-600" />
              </button>

              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-500">Página</span>
                <span className="text-sm font-bold text-[#204294] bg-[#204294]/10 px-2 py-1 rounded border border-[#204294]/20">
                  {currentPage}
                </span>
                <span className="text-sm text-slate-500">de {totalPages}</span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Feedback Popup */}
      {importFeedback && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-4 flex items-start justify-between ${
              importFeedback.errors > 0
                ? "bg-rose-50 border-l-4 border-l-rose-500"
                : "bg-emerald-50 border-l-4 border-l-emerald-500"
            }`}
          >
            <div className="flex gap-3">
              <div
                className={`mt-0.5 ${
                  importFeedback.errors > 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {importFeedback.errors > 0 ? (
                  <FileWarning size={20} />
                ) : (
                  <CheckCircle size={20} />
                )}
              </div>
              <div>
                <h4
                  className={`font-bold text-sm ${
                    importFeedback.errors > 0
                      ? "text-rose-800"
                      : "text-emerald-800"
                  }`}
                >
                  Relatório de Importação
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Processamento finalizado com os seguintes resultados:
                </p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {importFeedback.success} Sucessos
                  </span>
                  {importFeedback.errors > 0 && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      {importFeedback.errors} Erros
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setImportFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/50 rounded"
            >
              <X size={16} />
            </button>
          </div>
          {importFeedback.errors > 0 && importFeedback.details.length > 0 && (
            <div className="max-h-48 overflow-y-auto bg-white border-t border-slate-100 p-3">
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                Detalhes dos Erros:
              </p>
              <ul className="space-y-1.5">
                {importFeedback.details.map((detail, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-rose-600 flex items-start gap-2 bg-rose-50/50 p-1.5 rounded"
                  >
                    <span className="mt-0.5 block min-w-[4px] h-[4px] rounded-full bg-rose-400" />
                    <span className="leading-tight">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center gap-2">
                {editingId ? (
                  <Edit2 size={18} className="text-[#204294]" />
                ) : (
                  <Plus size={18} className="text-[#204294]" />
                )}
                {editingId ? "Editar Troca" : "Nova Troca de Turno"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Funcionário <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!!editingId}
                    className={`w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none bg-white text-slate-900 ${
                      editingId ? "bg-slate-100 text-slate-500" : ""
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Data Início <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Data Fim <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">
                      Horários
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 opacity-70">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Turno Original (Início)
                      </label>
                      <input
                        readOnly
                        type="time"
                        className="w-full border border-slate-200 rounded-lg p-2 bg-slate-100 text-slate-500 cursor-not-allowed"
                        value={originalShiftStart}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Turno Original (Fim)
                      </label>
                      <input
                        readOnly
                        type="time"
                        className="w-full border border-slate-200 rounded-lg p-2 bg-slate-100 text-slate-500 cursor-not-allowed"
                        value={originalShiftEnd}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center -my-2 relative z-10">
                    <div className="bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                      <ArrowRight size={14} className="text-[#204294]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#204294] mb-1">
                        Novo Horário (Início){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="time"
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900 focus:ring-2 focus:ring-[#204294]"
                        value={newShiftStart}
                        onChange={(e) => setNewShiftStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#204294] mb-1">
                        Novo Horário (Fim){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="time"
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900 focus:ring-2 focus:ring-[#204294]"
                        value={newShiftEnd}
                        onChange={(e) => setNewShiftEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motivo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Troca com colega..."
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] transition-colors shadow-sm font-bold"
                  >
                    Salvar Alteração
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Excluir Troca?
            </h3>
            <p className="text-slate-500 mb-6 text-sm">
              Esta ação não pode ser desfeita. O registro será removido
              permanentemente.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm font-medium"
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

export default ShiftChangeManager;
