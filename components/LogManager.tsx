import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
} from "lucide-react";
import { getSystemLogs } from "../services/dbService";
import { SystemLog } from "../types";

const LogManager: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await getSystemLogs();
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#204294]"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 w-48">Data/Hora</th>
                <th className="p-4 w-32">Ação</th>
                <th className="p-4 w-48">Usuário</th>
                <th className="p-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4 text-slate-500 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {formatDate(log.createdAt)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <User size={14} className="text-slate-400" />
                      {log.userName || "Sistema"}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-start gap-2">
                      <Activity
                        size={14}
                        className="mt-0.5 text-slate-300 flex-shrink-0"
                      />
                      {log.description}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Nenhuma atividade encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogManager;
