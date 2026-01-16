import React, { useState, useEffect, useRef } from "react";
import {
  Siren,
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
  AlertCircle,
  CheckCircle,
  FileWarning,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Employee, OnCallShift, SystemUser, Role, Squad } from "../types";
import {
  getEmployees,
  getOnCallShifts,
  saveOnCallShift,
  deleteOnCallShift,
} from "../services/dbService";
import { IonSkeletonText } from "@ionic/react";
import { formatDateBR } from "../server/src/utils/dateUtils";

interface OnCallManagerProps {
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

const OnCallManager: React.FC<OnCallManagerProps> = ({ currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<OnCallShift[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: "",
    startDate: "",
    endDate: "",
    squad: "",
    role: "",
  });

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- ESTADOS DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Import Feedback State
  const [importFeedback, setImportFeedback] = useState<{
    success: number;
    errors: number;
    details: string[];
  } | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [observation, setObservation] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, onCalls] = await Promise.all([
        getEmployees(),
        getOnCallShifts(),
      ]);
      setEmployees(emps);
      setShifts(onCalls);
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

  // Filtering Logic
  const filteredShifts = shifts.filter((s) => {
    const emp = employees.find((e) => e.id === s.employeeId);

    const nameMatch = emp
      ? (emp.firstName + " " + emp.lastName)
          .toLowerCase()
          .includes(filters.employeeName.toLowerCase())
      : false;

    const squadMatch = filters.squad ? emp?.squad === filters.squad : true;
    const roleMatch = filters.role ? emp?.role === filters.role : true;

    let dateMatch = true;
    if (filters.startDate) {
      dateMatch = dateMatch && s.date >= filters.startDate;
    }
    if (filters.endDate) {
      dateMatch = dateMatch && s.date <= filters.endDate;
    }

    return nameMatch && dateMatch && squadMatch && roleMatch;
  });

  // --- LÓGICA DE PAGINAÇÃO ---
  const totalItems = filteredShifts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedShifts = filteredShifts
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(startIndex, startIndex + itemsPerPage);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () =>
    setFilters({
      employeeName: "",
      startDate: "",
      endDate: "",
      squad: "",
      role: "",
    });

  const openNewModal = () => {
    setEditingId(null);
    setSelectedEmpId("");
    setDate("");
    setStartTime("07:00");
    setEndTime("17:00");
    setObservation("");
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (shift: OnCallShift) => {
    setEditingId(shift.id);
    setSelectedEmpId(shift.employeeId);
    setDate(shift.date);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setObservation(shift.observation);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEmpId || !date || !startTime || !endTime) {
      setError("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    const conflict = shifts.find(
      (s) =>
        s.employeeId === selectedEmpId && s.date === date && s.id !== editingId // Ignora o próprio registro se for edição
    );

    if (conflict) {
      setError(
        "Este funcionário já possui um plantão registrado para esta data."
      );
      return;
    }

    if (startTime >= endTime) {
      setError("A hora de fim deve ser posterior à hora de início.");
      return;
    }

    const existing = editingId ? shifts.find((s) => s.id === editingId) : null;

    const newShift: OnCallShift = {
      id: editingId || "",
      employeeId: selectedEmpId,
      date,
      startTime,
      endTime,
      observation,
      createdBy: existing?.createdBy || currentUser.name,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedBy: existing ? currentUser.name : undefined,
      updatedAt: existing ? new Date().toISOString() : undefined,
    };

    try {
      await saveOnCallShift(newShift, currentUser.name);
      await loadData();
      closeModal();
    } catch (err) {
      setError("Erro ao salvar plantão. Tente novamente.");
      console.error(err);
    }
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      try {
        await deleteOnCallShift(deleteConfirmationId, currentUser.name);
        await loadData();
        if (editingId === deleteConfirmationId) closeModal();
        setDeleteConfirmationId(null);
      } catch (err) {
        alert("Erro ao excluir plantão.");
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
    if (filteredShifts.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = [
      "Funcionário",
      "Matrícula",
      "Data",
      "Hora Início",
      "Hora Fim",
      "Observação",
      "Registrado Por",
      "Data Registro",
      "Atualizado Por",
      "Data Atualização",
    ];

    const rows = filteredShifts.map((s) => {
      const emp = employees.find((e) => e.id === s.employeeId);
      return [
        escapeCsv(emp ? `${emp.firstName} ${emp.lastName}` : "Desconhecido"),
        escapeCsv(emp ? emp.matricula : ""),
        escapeCsv(s.date),
        escapeCsv(s.startTime),
        escapeCsv(s.endTime),
        escapeCsv(s.observation),
        escapeCsv(s.createdBy),
        escapeCsv(s.createdAt),
        escapeCsv(s.updatedBy),
        escapeCsv(s.updatedAt),
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
      `plantoes_smarttime_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Matrícula", "Data", "Início", "Fim", "Observação"];
    const exampleRow1 = [
      "1001",
      "2023-12-25",
      "08:00",
      "20:00",
      "Plantão Natal",
    ];
    const exampleRow2 = [
      "1002",
      "31/12/2023",
      "20:00",
      "08:00",
      "Plantão Ano Novo",
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
    link.setAttribute("download", `template_importacao_plantoes.csv`);
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
      alert(
        "Erro ao ler o arquivo. Tente novamente ou verifique se o arquivo não está corrompido."
      );
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

        if (cols.length >= 4) {
          const [matricula, dateRaw, startTime, endTime, obs] = cols;

          const emp = currentEmployees.find((e) => e.matricula === matricula);
          if (!emp) {
            errorCount++;
            errorsDetails.push(
              `Linha ${
                i + 1
              }: Funcionário com matrícula '${matricula}' não encontrado.`
            );
            continue;
          }

          let finalDate = "";
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
            finalDate = dateRaw;
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateRaw)) {
            const [day, month, year] = dateRaw.split("/");
            finalDate = `${year}-${month}-${day}`;
          } else {
            errorCount++;
            errorsDetails.push(
              `Linha ${
                i + 1
              }: Data inválida '${dateRaw}' para matrícula ${matricula}.`
            );
            continue;
          }

          const hasConflict = shifts.some(
            (s) => s.employeeId === emp.id && s.date === finalDate
          );

          if (hasConflict) {
            errorCount++;
            errorsDetails.push(
              `Linha ${i + 1}: O funcionário ${
                emp.firstName
              } já possui um plantão em ${finalDate}.`
            );
            continue; // Pula para a próxima linha do CSV
          }

          const newShift: OnCallShift = {
            id: "",
            employeeId: emp.id,
            date: finalDate,
            startTime: startTime,
            endTime: endTime,
            observation: obs || "",
            createdBy: currentUser.name + " (Import)",
            createdAt: new Date().toISOString(),
          };

          promises.push(saveOnCallShift(newShift, currentUser.name));
          importedCount++;
        } else {
          errorCount++;
          errorsDetails.push(
            `Linha ${i + 1}: Formato incorreto ou colunas insuficientes.`
          );
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
        details: [
          "Erro crítico ao processar o arquivo. Verifique o formato do CSV.",
        ],
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E]">
            Escala de Plantões
          </h1>
          <p className="text-slate-500">
            Gerencie os funcionários escalados para plantão.
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
            title="Adicionar Plantão"
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

      {/* --- SELETOR DE ITENS POR PÁGINA (Abaixo dos botões) --- */}
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
          <h3 className="font-semibold text-slate-700">Plantões Agendados</h3>
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            Total: {totalItems}
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-oncall-${i}`} className="p-4">
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
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-4">
                      <IonSkeletonText
                        animated
                        style={{ width: "90px", height: "18px" }}
                      />
                      <IonSkeletonText
                        animated
                        style={{ width: "110px", height: "18px" }}
                      />
                    </div>
                    <IonSkeletonText
                      animated
                      style={{ width: "60%", height: "10px" }}
                    />
                  </div>
                  <div className="md:justify-end">
                    <div className="w-8 h-8 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedShifts.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Siren size={32} />
            </div>
            <p>Nenhum plantão encontrado com os filtros selecionados.</p>
            {shifts.length > 0 && (
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
            {paginatedShifts.map((shift) => {
              const emp = employees.find((e) => e.id === shift.employeeId);
              const auditUser = shift.updatedBy || shift.createdBy || "Sistema";
              const auditDate = shift.updatedAt || shift.createdAt;
              const auditLabel = shift.updatedBy
                ? "Atualizado por"
                : "Registrado por";

              return (
                <div
                  key={shift.id}
                  onClick={() => handleEdit(shift)}
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

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-sm font-medium w-fit">
                          <Calendar size={14} />
                          {formatDateBR(shift.date)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Clock size={14} />
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>

                      {shift.observation && (
                        <div className="text-xs text-slate-500 mt-1 italic">
                          "{shift.observation}"
                        </div>
                      )}

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
                          requestDelete(shift.id);
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center gap-2">
                {editingId ? (
                  <Edit2 size={18} className="text-[#204294]" />
                ) : (
                  <Plus size={18} className="text-[#204294]" />
                )}
                {editingId ? "Editar Plantão" : "Novo Plantão"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data do Plantão <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hora Início <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="time"
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hora Fim <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="time"
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Observação
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Sobreaviso remoto, Plantão presencial..."
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900 resize-none"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
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
                    Salvar
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
              Excluir Plantão?
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

export default OnCallManager;
