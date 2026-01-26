import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  User,
  Upload,
  AlertCircle,
  Briefcase,
  Clock,
  Filter,
  ArrowUp,
  ArrowDown,
  X,
  Search,
  Download,
  FileText,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Employee, Role, Squad, SystemUser } from "../types";
import {
  getEmployees,
  saveEmployee,
  deleteEmployee,
} from "../services/dbService";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IonSkeletonText } from "@ionic/react";

interface EmployeeManagerProps {
  currentUser: SystemUser;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.isAdmin;

  // Filter & Sort State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    name: "",
    matricula: "",
    role: "",
    squad: "",
    shiftStart: "",
  });

  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADOS DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    role: "" as Role,
    squad: "" as Squad,
    shiftStart: "08:00",
    shiftEnd: "18:00",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Resetar para a página 1 sempre que os filtros ou paginação mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder, itemsPerPage]);

  // --- Filtering & Sorting Logic ---

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      matricula: "",
      role: "",
      squad: "",
      shiftStart: "",
    });
  };

  const filteredEmployees = employees
    .filter((emp) => {
      const matchesName = (emp.firstName + " " + emp.lastName)
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchesMatricula = filters.matricula
        ? emp.matricula === filters.matricula
        : true;
      const matchesRole = filters.role ? emp.role === filters.role : true;
      const matchesSquad = filters.squad ? emp.squad === filters.squad : true;
      const matchesShift = filters.shiftStart
        ? emp.shiftStart === filters.shiftStart
        : true;

      return (
        matchesName &&
        matchesMatricula &&
        matchesRole &&
        matchesSquad &&
        matchesShift
      );
    })
    .sort((a, b) => {
      const nameA = (a.firstName + " " + a.lastName).toLowerCase();
      const nameB = (b.firstName + " " + b.lastName).toLowerCase();

      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

  // --- LÓGICA DE PAGINAÇÃO ---
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // --- Modal & CRUD Logic ---

  const openModal = (employee?: Employee) => {
    if (!isAdmin) return;

    setFormError(null);
    if (employee) {
      setFormData(employee);
      setEditingId(employee.id);
    } else {
      setEditingId(null);
      setFormData({
        role: "" as Role,
        squad: "" as Squad,
        shiftStart: "08:00",
        shiftEnd: "18:00",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setFormError(null);
    const targetMatricula = formData.matricula?.trim();

    if (!targetMatricula) {
      setFormError("A matrícula é obrigatória.");
      return;
    }

    if (!/^\d+$/.test(targetMatricula)) {
      setFormError("A matrícula deve conter apenas números.");
      return;
    }

    const duplicate = employees.find(
      (emp) => emp.matricula === targetMatricula && emp.id !== editingId,
    );

    if (duplicate) {
      setFormError(
        `Erro: A matrícula "${targetMatricula}" já está cadastrada para o funcionário ${duplicate.firstName} ${duplicate.lastName}.`,
      );
      return;
    }

    if (!formData.squad) {
      setFormError("A Squad é obrigatória.");
      return;
    }

    const newEmp: Employee = {
      id: editingId || "",
      matricula: targetMatricula,
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      email: formData.email || "",
      role: formData.role as Role,
      squad: formData.squad as Squad,
      shiftStart: formData.shiftStart || "09:00",
      shiftEnd: formData.shiftEnd || "18:00",
    };

    try {
      await saveEmployee(newEmp, currentUser.name);
      await loadData();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        role: Role.INFRA_ANALYST,
        squad: Squad.LAKERS,
        shiftStart: "09:00",
        shiftEnd: "18:00",
      });
    } catch (error) {
      setFormError("Erro ao salvar no banco de dados. Tente novamente.");
    }
  };

  const requestDelete = (id: string) => {
    if (!isAdmin) return;
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId && isAdmin) {
      await deleteEmployee(deleteConfirmationId, currentUser.name);
      await loadData();
      setDeleteConfirmationId(null);
    }
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
    if (filteredEmployees.length === 0) {
      toast("Não há dados para exportar.");
      return;
    }

    const headers = [
      "Matrícula",
      "Nome",
      "Sobrenome",
      "Email",
      "Cargo",
      "Squad",
      "Início Expediente",
      "Fim Expediente",
    ];

    const rows = filteredEmployees.map((emp) => [
      escapeCsv(emp.matricula),
      escapeCsv(emp.firstName),
      escapeCsv(emp.lastName),
      escapeCsv(emp.email),
      escapeCsv(emp.role),
      escapeCsv(emp.squad),
      escapeCsv(emp.shiftStart),
      escapeCsv(emp.shiftEnd),
    ]);

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
      `funcionarios_smarttime_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Matricula",
      "Nome",
      "Sobrenome",
      "Email",
      "Cargo",
      "Squad",
      "InicioExpediente",
      "FimExpediente",
    ];
    const exampleRow1 = [
      "1001",
      "João",
      "Silva",
      "joao.silva@exemplo.com",
      "Analista de Infraestrutura",
      "Lakers",
      "09:00",
      "18:00",
    ];

    const csvContent = [headers.join(";"), exampleRow1.join(";")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `template_importacao_funcionarios.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (!isAdmin) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const csvText = evt.target?.result as string;
      if (csvText) {
        if (csvText.includes("\uFFFD")) {
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
    reader.readAsText(file);
    e.target.value = "";
  };

  const processCSV = async (csvText: string) => {
    const lines = csvText.split("\n");
    const normalizeStr = (str: string) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    };

    const promises = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(";").map((c) => c.trim().replace(/^"|"$/g, ""));

      if (cols.length >= 7) {
        const [
          matricula,
          firstName,
          lastName,
          email,
          roleRaw,
          squadRaw,
          shiftStart,
          shiftEnd,
        ] = cols;

        if (!/^\d+$/.test(matricula)) continue;
        if (employees.some((e) => e.matricula === matricula)) continue;

        const findEnum = (enumObj: any, val: string) =>
          Object.entries(enumObj).find(
            ([k, v]) =>
              normalizeStr(v as string) === normalizeStr(val) ||
              normalizeStr(k) === normalizeStr(val),
          )?.[1];

        const role = findEnum(Role, roleRaw) as Role;
        const squad = findEnum(Squad, squadRaw) as Squad;

        if (role && squad) {
          const newEmp: Employee = {
            id: "",
            matricula,
            firstName,
            lastName,
            email,
            role,
            squad,
            shiftStart: shiftStart || "09:00",
            shiftEnd: shiftEnd || "18:00",
          };
          promises.push(saveEmployee(newEmp, currentUser.name));
        }
      }
    }

    await Promise.all(promises);
    toast.success("Importação Concluída!", {
      position: "top-right",
      autoClose: 3000,
      theme: "light",
      transition: Bounce,
    });
    await loadData();
  };

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

  return (
    <div>
      {/* Header Responsivo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Funcionários</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie o quadro de colaboradores CX.
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
            className="flex-1 md:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-[#3F3F3F] px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Exportar para CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex-1 md:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-[#3F3F3F] px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Baixar Modelo de Importação"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={handleImportClick}
            className="flex-1 md:flex-none bg-[#01B8A1] hover:bg-[#019f8b] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm font-medium"
            title="Importar Funcionário"
          >
            <Upload size={18} />
          </button>
          <button
            onClick={() => openModal()}
            className="flex-1 md:flex-none bg-[#204294] hover:bg-[#1a367a] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm font-medium"
            title="Adicionar Funcionário"
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
                    value={filters.name}
                    onChange={(e) =>
                      setFilters({ ...filters, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      placeholder="000"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                      value={filters.matricula}
                      onChange={(e) =>
                        setFilters({ ...filters, matricula: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                      Horário Início
                    </label>
                    <input
                      type="time"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                      value={filters.shiftStart}
                      onChange={(e) =>
                        setFilters({ ...filters, shiftStart: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">
                    Squad
                  </label>
                  <select
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                    value={filters.squad}
                    onChange={(e) =>
                      setFilters({ ...filters, squad: e.target.value as Squad })
                    }
                  >
                    <option value="">Todas as Squads</option>
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
                      setFilters({ ...filters, role: e.target.value as Role })
                    }
                  >
                    <option value="">Todos os Cargos</option>
                    {Object.values(Role).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
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
      {/* Seletor de Itens por Página Ajustado */}
      <div className="flex justify-end">
        <div className=" p-2 px-3 rounded-xl flex items-center w-fit">
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

      {/* MOBILE LIST VIEW (Cards) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`sk-card-${i}`}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative h-32 animate-pulse"
            />
          ))
        ) : paginatedEmployees.length === 0 ? (
          <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200">
            Nenhum funcionário encontrado.
          </div>
        ) : (
          paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => isAdmin && openModal(emp)}
              className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative ${isAdmin ? "active:bg-slate-50" : ""
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1E1E1E] font-bold text-sm">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E1E1E] text-sm">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-xs text-slate-500">{emp.email}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDelete(emp.id);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Cargo</span>
                  <span className="text-slate-700 font-semibold text-right max-w-[60%] truncate">
                    {emp.role}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Matrícula</span>
                  <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {emp.matricula}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-medium border ${getSquadBadgeColor(
                      emp.squad,
                    )}`}
                  >
                    {emp.squad}
                  </span>
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <Clock size={12} /> {emp.shiftStart} - {emp.shiftEnd}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-slate-50 text-[#3F3F3F] border-b border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-700">
            <tr>
              <th
                className="p-4 font-bold text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group w-1/3"
                onClick={toggleSort}
              >
                <div className="flex items-center gap-1">
                  Funcionário
                  <span
                    className={`text-slate-400 group-hover:text-[#204294] transition-colors ${sortOrder === "asc" ? "text-[#204294]" : ""
                      }`}
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    )}
                  </span>
                </div>
              </th>
              <th className="p-4 font-bold text-sm">Matrícula</th>
              <th className="p-4 font-bold text-sm">Cargo</th>
              <th className="p-4 font-bold text-sm">Squad</th>
              <th className="p-4 font-bold text-sm">Horário</th>
              {isAdmin && (
                <th className="p-4 font-bold text-sm text-right"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-row-${i}`}>
                  <td className="p-4" colSpan={isAdmin ? 6 : 5}>
                    <IonSkeletonText
                      animated
                      style={{ width: "100%", height: "20px" }}
                    />
                  </td>
                </tr>
              ))
            ) : paginatedEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  className="p-8 text-center text-slate-500"
                >
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => isAdmin && openModal(emp)}
                  className={`group transition-all duration-200 ${isAdmin
                    ? "hover:bg-[#204294]/5 cursor-pointer dark:hover:bg-slate-700/50"
                    : "cursor-default"
                    }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1E1E1E] dark:bg-slate-700 dark:text-white">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-[#1E1E1E] group-hover:text-[#204294] dark:text-white dark:group-hover:text-blue-400">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-mono dark:text-slate-400">
                    {emp.matricula}
                  </td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{emp.role}</td>
                  <td className="p-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-md font-medium text-xs border ${getSquadBadgeColor(
                        emp.squad,
                      )}`}
                    >
                      {emp.squad}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                    {emp.shiftStart} - {emp.shiftEnd}
                  </td>
                  {isAdmin && (
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(emp.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* --- RODAPÉ DE PAGINAÇÃO --- */}
        {!isLoading && totalItems > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 dark:bg-slate-800 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando{" "}
              <span className="font-bold text-slate-800 dark:text-white">
                {totalItems === 0 ? 0 : startIndex + 1}
              </span>{" "}
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

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] dark:bg-slate-800">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center dark:border-slate-700">
              <h3 className="text-lg font-bold text-[#1E1E1E] dark:text-white">
                {editingId ? "Editar Funcionário" : "Novo Funcionário"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full transition-colors dark:hover:text-slate-300"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto"
            >
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-[#204294] mb-3 flex items-center gap-2 dark:text-blue-400">
                  <User size={16} /> Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Nome
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                      value={formData.firstName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Sobrenome
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                      value={formData.lastName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Email Corporativo
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Matrícula
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                      value={formData.matricula || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          matricula: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-bold text-[#204294] mb-3 flex items-center gap-2 dark:text-blue-400">
                  <Briefcase size={16} /> Cargo e Alocação
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Cargo
                    </label>
                    <select
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as Role,
                        })
                      }
                    >
                      <option value="" disabled>
                        Selecionar um Cargo...
                      </option>
                      {Object.values(Role).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Squad
                    </label>
                    <select
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                      value={formData.squad || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          squad: e.target.value as Squad,
                        })
                      }
                    >
                      <option value="" disabled>
                        Selecione uma Squad...
                      </option>
                      {Object.values(Squad).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-bold text-[#204294] mb-3 flex items-center gap-2 dark:text-blue-400">
                  <Clock size={16} /> Jornada de Trabalho
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Início Expediente
                    </label>
                    <input
                      required
                      type="time"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500 dark:[color-scheme:dark]"
                      value={formData.shiftStart}
                      onChange={(e) =>
                        setFormData({ ...formData, shiftStart: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                      Fim Expediente
                    </label>
                    <input
                      required
                      type="time"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500 dark:[color-scheme:dark]"
                      value={formData.shiftEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, shiftEnd: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-white hover:bg-red-700 rounded-lg font-medium transition duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] font-bold"
                >
                  Salvar Funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center dark:bg-slate-800">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">
              Excluir Funcionário?
            </h3>
            <p className="text-slate-500 mb-6 text-sm dark:text-slate-400">
              Esta ação não pode ser desfeita. Todos os registros relacionados
              serão removidos.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium dark:text-slate-300 dark:hover:bg-slate-700 "
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium dark:bg-rose-600 dark:hover:bg-rose-700"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer aria-label="Notificações do Sistema" />
    </div>
  );
};

export default EmployeeManager;
