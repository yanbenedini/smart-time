
import React, { useState, useEffect } from 'react';
import { Scroll, Search, Download, Filter, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { SystemLog, SystemUser } from '../types';
import { getSystemLogs } from '../services/dbService';

interface LogManagerProps {
  currentUser: SystemUser;
}

const LogManager: React.FC<LogManagerProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, actionFilter, dateFilter]);

  const loadLogs = () => {
    const data = getSystemLogs();
    // Sort by newest first
    const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(sorted);
  };

  const applyFilters = () => {
    let result = logs;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.details.toLowerCase().includes(lower) || 
        log.performedBy.toLowerCase().includes(lower) ||
        log.target.toLowerCase().includes(lower)
      );
    }

    if (actionFilter) {
      result = result.filter(log => log.action === actionFilter);
    }

    if (dateFilter) {
      result = result.filter(log => log.timestamp.startsWith(dateFilter));
    }

    setFilteredLogs(result);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'LOGIN': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('pt-BR');
    } catch {
      return isoString;
    }
  };

  // CSV Export Logic
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("Não há logs para exportar.");
      return;
    }

    const headers = ['ID', 'Data/Hora', 'Ação', 'Alvo', 'Detalhes', 'Realizado Por'];
    
    // Helper to escape CSV fields
    const escapeCsv = (str: string) => {
        if (!str) return '""';
        const stringValue = String(str);
        if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    const rows = filteredLogs.map(log => [
      escapeCsv(log.id),
      escapeCsv(formatDateTime(log.timestamp)),
      escapeCsv(log.action),
      escapeCsv(log.target),
      escapeCsv(log.details),
      escapeCsv(log.performedBy)
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `logs_sistema_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E]">Logs do Sistema</h1>
          <p className="text-slate-500">Auditoria completa de ações e alterações.</p>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={loadLogs}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-[#204294] text-white px-4 py-2 rounded-lg hover:bg-[#1a367a] transition-colors font-bold shadow-sm"
          >
            <Download size={18} />
            Exportar Logs
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
                type="text" 
                placeholder="Buscar em detalhes, usuário ou alvo..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#204294]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <select 
                className="border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#204294] text-sm text-slate-600"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
            >
                <option value="">Todas Ações</option>
                <option value="CREATE">Criação</option>
                <option value="UPDATE">Edição</option>
                <option value="DELETE">Exclusão</option>
                <option value="LOGIN">Login</option>
            </select>
            
            <input 
                type="date"
                className="border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#204294] text-sm text-slate-600"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
            />
            
            {(searchTerm || actionFilter || dateFilter) && (
                <button 
                    onClick={() => {
                        setSearchTerm('');
                        setActionFilter('');
                        setDateFilter('');
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Limpar Filtros"
                >
                    <X size={20} />
                </button>
            )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                        <th className="p-4 w-40">Data/Hora</th>
                        <th className="p-4 w-32">Ação</th>
                        <th className="p-4 w-40">Alvo</th>
                        <th className="p-4">Detalhes</th>
                        <th className="p-4 w-48">Realizado Por</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono text-xs text-slate-500">
                                    {formatDateTime(log.timestamp)}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-slate-700">
                                    {log.target}
                                </td>
                                <td className="p-4 text-slate-600">
                                    {log.details}
                                </td>
                                <td className="p-4 text-slate-700 font-medium">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={14} className="text-slate-400" />
                                        {log.performedBy}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400">
                                <Scroll size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Nenhum registro encontrado.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-right">
            Mostrando {filteredLogs.length} de {logs.length} registros
        </div>
      </div>
    </div>
  );
};

export default LogManager;
