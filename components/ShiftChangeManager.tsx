import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, Calendar, AlertTriangle, CheckCircle, RefreshCw, Trash2, ArrowLeftRight, Edit2, Plus, X, UserCircle, Download, Search, Filter } from 'lucide-react';
import { Employee, ShiftChange, SystemUser } from '../types';
import { getEmployees, getShiftChanges, saveShiftChange, deleteShiftChange } from '../services/dbService';

interface ShiftChangeManagerProps {
  currentUser: SystemUser;
}

const ShiftChangeManager: React.FC<ShiftChangeManagerProps> = ({ currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [changes, setChanges] = useState<ShiftChange[]>([]);
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: '',
    startDate: '',
    endDate: ''
  });

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('');
  const [newShiftEnd, setNewShiftEnd] = useState('');
  const [reason, setReason] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    setEmployees(getEmployees());
    setChanges(getShiftChanges());
  }, []);

  // Filtering Logic
  const filteredChanges = changes.filter(ch => {
    const emp = employees.find(e => e.id === ch.employeeId);
    
    // 1. Employee Name
    const nameMatch = emp ? (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(filters.employeeName.toLowerCase()) : false;
    
    // 2. Date Range Overlap
    let dateMatch = true;
    if (filters.startDate) {
        dateMatch = dateMatch && ch.endDate >= filters.startDate;
    }
    if (filters.endDate) {
        dateMatch = dateMatch && ch.startDate <= filters.endDate;
    }

    return nameMatch && dateMatch;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => setFilters({ employeeName: '', startDate: '', endDate: '' });

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

  const openNewModal = () => {
    setEditingId(null);
    setSelectedEmpId('');
    setStartDate('');
    setEndDate('');
    setNewShiftStart('');
    setNewShiftEnd('');
    setReason('');
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
    setNewShiftStart(change.newShiftStart);
    setNewShiftEnd(change.newShiftEnd);
    setReason(change.reason);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    if (newShiftStart >= newShiftEnd) {
      setError('A hora de fim deve ser posterior à hora de início.');
      return;
    }
    if (startDate > endDate) {
      setError('A data de início deve ser anterior ou igual à data fim.');
      return;
    }

    const existing = editingId ? changes.find(c => c.id === editingId) : null;

    const newChange: ShiftChange = {
      id: editingId || Date.now().toString(),
      employeeId: selectedEmpId,
      originalShiftStart: emp.shiftStart,
      originalShiftEnd: emp.shiftEnd,
      newShiftStart,
      newShiftEnd,
      startDate,
      endDate,
      reason,
      // Audit Logic
      createdBy: existing?.createdBy || currentUser.name,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedBy: existing ? currentUser.name : undefined,
      updatedAt: existing ? new Date().toISOString() : undefined
    };

    saveShiftChange(newChange);
    setChanges(getShiftChanges());
    closeModal();
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      deleteShiftChange(deleteConfirmationId);
      setChanges(getShiftChanges());
      if (editingId === deleteConfirmationId) closeModal();
      setDeleteConfirmationId(null);
    }
  };

  // Date formatter for audit info
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // CSV Helper
  const escapeCsv = (str: string | undefined | null) => {
    if (!str) return '""';
    const stringValue = String(str);
    // Include semicolon
    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
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
      'Funcionário', 'Motivo', 'Data Início', 'Data Fim', 
      'Turno Original Início', 'Turno Original Fim', 
      'Novo Turno Início', 'Novo Turno Fim',
      'Registrado Por', 'Data Registro', 'Atualizado Por', 'Data Atualização'
    ];
    
    const rows = filteredChanges.map(ch => {
      const emp = employees.find(e => e.id === ch.employeeId);
      return [
        escapeCsv(emp ? `${emp.firstName} ${emp.lastName}` : 'Desconhecido'),
        escapeCsv(ch.reason),
        escapeCsv(ch.startDate),
        escapeCsv(ch.endDate),
        escapeCsv(ch.originalShiftStart),
        escapeCsv(ch.originalShiftEnd),
        escapeCsv(ch.newShiftStart),
        escapeCsv(ch.newShiftEnd),
        escapeCsv(ch.createdBy),
        escapeCsv(ch.createdAt),
        escapeCsv(ch.updatedBy),
        escapeCsv(ch.updatedAt)
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trocas_smarttime_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E]">Trocas de Horário</h1>
          <p className="text-slate-500">Registre alterações temporárias na jornada de trabalho.</p>
        </div>
        <div className="flex flex-wrap gap-2 relative w-full md:w-auto">
             
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm border ${isFilterOpen || activeFilterCount > 0 ? 'bg-[#204294]/10 border-[#204294]/20 text-[#204294]' : 'bg-white border-slate-200 text-[#3F3F3F] hover:bg-slate-50'}`}
            >
                <Filter size={18} />
                <span className="hidden sm:inline">Filtrar</span>
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
                <span className="hidden sm:inline">Exportar</span>
            </button>
            <button 
            onClick={openNewModal}
            className="flex-1 md:flex-none bg-[#204294] hover:bg-[#1a367a] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-bold"
            >
            <Plus size={18} />
            <span className="hidden sm:inline">Nova Troca</span>
            </button>

            {/* Filter Dropdown Panel */}
            {isFilterOpen && (
                <div className="absolute top-12 right-0 w-full md:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-[#1E1E1E] flex items-center gap-2">
                    <Search size={16} /> Filtros
                    </h3>
                    <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                    </button>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">Nome do Funcionário</label>
                        <input 
                            type="text" 
                            placeholder="Buscar por nome..." 
                            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                            value={filters.employeeName}
                            onChange={(e) => setFilters({...filters, employeeName: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">Data Início</label>
                            <input 
                            type="date" 
                            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                            value={filters.startDate}
                            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">Data Fim</label>
                            <input 
                            type="date" 
                            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                            value={filters.endDate}
                            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
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

      {/* List Section - Full Width */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Histórico de Trocas</h3>
            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                Total: {filteredChanges.length}
            </span>
        </div>

        {filteredChanges.length === 0 ? (
           <div className="text-center p-12 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <ArrowLeftRight size={32} />
              </div>
              <p>Nenhuma troca encontrada com os filtros selecionados.</p>
              {changes.length > 0 && (
                <button onClick={clearFilters} className="text-[#204294] font-medium hover:underline mt-2">
                    Limpar filtros
                </button>
              )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredChanges.slice().reverse().map(change => {
                const emp = employees.find(e => e.id === change.employeeId);
                
                // Determine Audit Info
                const auditUser = change.updatedBy || change.createdBy || 'Sistema';
                const auditDate = change.updatedAt || change.createdAt;
                const auditLabel = change.updatedBy ? 'Atualizado por' : 'Registrado por';

                return (
                  <div 
                    key={change.id} 
                    onClick={() => handleEdit(change)}
                    className="p-4 hover:bg-[#204294]/5 transition-colors duration-200 cursor-pointer group hover:shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Employee Info */}
                        <div className="flex items-center gap-3 md:w-1/3">
                             <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1E1E1E] font-bold group-hover:bg-[#204294] group-hover:text-white transition-colors">
                                {emp ? emp.firstName.charAt(0) : '?'}
                             </div>
                             <div>
                                <div className="font-bold text-[#1E1E1E]">
                                    {emp ? `${emp.firstName} ${emp.lastName}` : 'Funcionário removido'}
                                </div>
                                <div className="text-xs text-slate-500">{emp?.role}</div>
                             </div>
                        </div>

                        {/* Middle: Details */}
                        <div className="flex-1 space-y-1">
                             <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                {change.reason}
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  <Calendar size={12} />
                                  {change.startDate === change.endDate 
                                    ? change.startDate 
                                    : `${change.startDate} até ${change.endDate}`
                                  }
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 line-through decoration-rose-300 decoration-2">
                                        {change.originalShiftStart} - {change.originalShiftEnd}
                                    </span>
                                    <ArrowRight size={10} className="text-slate-300" />
                                    <span className="font-bold text-[#204294] bg-[#204294]/10 px-1 rounded">
                                        {change.newShiftStart} - {change.newShiftEnd}
                                    </span>
                                </div>
                             </div>

                             {/* Audit Info */}
                             {(auditDate) && (
                                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 border-t border-slate-100 pt-1 w-full md:w-auto">
                                   <UserCircle size={10} />
                                   <span>
                                     {auditLabel} <strong>{auditUser}</strong> em {formatDateTime(auditDate)}
                                   </span>
                                </div>
                             )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 md:justify-end">
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(change.id);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Excluir"
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
      </div>

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <div>
                    <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center gap-2">
                        {editingId ? <Edit2 size={18} className="text-[#204294]" /> : <Plus size={18} className="text-[#204294]" />}
                        {editingId ? 'Editar Troca de Horário' : 'Nova Troca de Horário'}
                    </h3>
                    <p className="text-sm text-slate-500">Defina o novo horário temporário.</p>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Funcionário <span className="text-rose-500">*</span></label>
                        <select 
                            required 
                            disabled={!!editingId}
                            className={`w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none bg-white text-slate-900 ${editingId ? 'bg-slate-100 text-slate-500' : ''}`}
                            value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>

                    {selectedEmployee && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Horário Padrão (Atual)</p>
                                <p className="text-lg font-bold text-slate-700 font-mono">
                                    {selectedEmployee.shiftStart} <span className="text-slate-400 mx-1">-</span> {selectedEmployee.shiftEnd}
                                </p>
                            </div>
                            <div className="text-slate-400 rotate-90 sm:rotate-0">
                                <ArrowRight size={24} />
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-xs text-[#204294] font-medium uppercase mb-1">Novo Horário Proposto</p>
                                <div className="flex items-center justify-center sm:justify-end gap-1">
                                    <input 
                                    required 
                                    type="time" 
                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-sm w-24 outline-none focus:border-[#204294] text-center"
                                    value={newShiftStart}
                                    onChange={e => setNewShiftStart(e.target.value)}
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input 
                                    required 
                                    type="time" 
                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-sm w-24 outline-none focus:border-[#204294] text-center"
                                    value={newShiftEnd}
                                    onChange={e => setNewShiftEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Início <span className="text-rose-500">*</span></label>
                            <input required type="date" className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                            value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim <span className="text-rose-500">*</span></label>
                            <input required type="date" className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                            value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo <span className="text-rose-500">*</span></label>
                        <input required type="text" placeholder="Ex: Cobrir férias, Troca com colega..." 
                            className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                            value={reason} onChange={e => setReason(e.target.value)} />
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                 <button onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">
                    Cancelar
                 </button>
                 <button onClick={handleSubmit} className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] transition-colors shadow-sm font-bold">
                    {editingId ? 'Salvar Alterações' : 'Confirmar Troca'}
                 </button>
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">Cancelar Troca?</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Esta ação não pode ser desfeita. O registro da troca será removido permanentemente.
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