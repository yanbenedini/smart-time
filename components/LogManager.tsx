import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getSystemLogs } from "../services/dbService";
import { SystemLog } from "../types";
import { IonSkeletonText } from "@ionic/react";

const LogManager: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getSystemLogs();
      setLogs(data);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Resetar para a página 1 sempre que pesquisar algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const filteredLogs = logs.filter(
    (log) =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LÓGICA DE PAGINAÇÃO ---
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "DELETE":
        return "text-rose-600 bg-rose-50 border-rose-100";
      case "UPDATE":
        return "text-blue-600 bg-blue-50 border-blue-100";
      case "LOGIN":
        return "text-purple-600 bg-purple-50 border-purple-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] flex items-center gap-2">
            <ScrollText className="text-[#204294]" />
            Logs do Sistema
          </h1>
          <p className="text-slate-500">
            Auditoria de ações e eventos importantes.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 text-slate-500 hover:text-[#204294] hover:bg-slate-100 rounded-lg transition-colors"
          title="Atualizar Logs"
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Search & Items Per Page */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#204294]"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-[#204294] bg-white font-medium text-[#204294]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>por página</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 w-48">Data/Hora</th>
                <th className="p-4 w-32">Ação</th>
                <th className="p-4 w-48">Usuário</th>
                <th className="p-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`sk-log-${i}`}>
                    <td className="p-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-100 rounded-full animate-pulse" />
                        <IonSkeletonText
                          animated
                          style={{ width: "100px", height: "10px" }}
                        />
                      </div>
                    </td>
                    <td className="p-4 w-32">
                      <IonSkeletonText
                        animated
                        style={{
                          width: "60px",
                          height: "18px",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                    <td className="p-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-slate-100 animate-pulse" />
                        <IonSkeletonText
                          animated
                          style={{ width: "80px", height: "10px" }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <IonSkeletonText
                        animated
                        style={{ width: "90%", height: "10px" }}
                      />
                    </td>
                  </tr>
                ))
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Nenhuma atividade encontrada.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 w-48 text-slate-500 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td className="p-4 w-32">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 w-48">
                      <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                        <User
                          size={14}
                          className="text-slate-400 flex-shrink-0"
                        />
                        <span className="truncate">
                          {log.userName || "Sistema"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-start gap-2">
                        <Activity
                          size={14}
                          className="mt-0.5 text-slate-300 flex-shrink-0"
                        />
                        <span className="truncate md:whitespace-normal">
                          {log.description}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- RODAPÉ DE PAGINAÇÃO --- */}
        {!isLoading && totalItems > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-bold text-slate-800">
                {totalItems === 0 ? 0 : startIndex + 1}
              </span>{" "}
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
    </div>
  );
};

export default LogManager;
