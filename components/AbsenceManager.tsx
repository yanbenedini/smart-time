import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock, Plus, X, CalendarRange, CalendarDays, Trash2, Edit2, Search, Filter, UserCircle, Download } from 'lucide-react';
import { Employee, Absence, SystemUser } from '../types';
import { getEmployees, getAbsences, saveAbsence, deleteAbsence, checkCoverage } from '../services/dbService';

type AbsenceType = 'single' | 'range' | 'multi';

interface AbsenceManagerProps {
  currentUser: SystemUser;
}

const REASON_OPTIONS = [
  'Férias',
  'Banco de Horas',
  'Consulta médica',
  'Doente',
  'Passando mal',
  'Imprevisto pessoal'
];

const AbsenceManager: React.FC<AbsenceManagerProps> = ({ currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [absenceType, setAbsenceType] = useState<AbsenceType>('single');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  
  // Date States
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [manualDates, setManualDates] = useState<string[]>([]);
  const [tempManualDate, setTempManualDate] = useState('');

  // Time States
  const [isFullDay, setIsFullDay] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Reason States
  const [reasonCategory, setReasonCategory] = useState(''); // Controls the dropdown
  const [reason, setReason] = useState(''); // The actual value saved
  const [observation, setObservation] = useState('');
  
  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Warning Modal State (Coverage)
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [pendingAbsenceData, setPendingAbsenceData] = useState<any>(null);

  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // --- DATA LOADING ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emps, abs] = await Promise.all([getEmployees(), getAbsences()]);
      setEmployees(emps);
      setAbsences(abs);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  // Filtering Logic
  const filteredAbsences = absences.filter(abs => {
    const emp = employees.find(e => e.id === abs.employeeId);
    
    // 1. Employee Name
    const nameMatch = emp ? (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(filters.employeeName.toLowerCase()) : false;
    
    // 2. Reason
    const reasonMatch = abs.reason.toLowerCase().includes(filters.reason.toLowerCase());
    
    // 3. Date Range
    let dateMatch = true;
    if (filters.startDate) {
        dateMatch = dateMatch && abs.endDate >= filters.startDate;
    }
    if (filters.endDate) {
        dateMatch = dateMatch && abs.date <= filters.endDate;
    }

    return nameMatch && reasonMatch && dateMatch;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => setFilters({ employeeName: '', startDate: '', endDate: '', reason: '' });


  // Reset times when employee changes (only if not editing)
  useEffect(() => {
    if (selectedEmpId && !editingId) {
      setStartTime('');
      setEndTime('');
      setIsFullDay(false);
    }
  }, [selectedEmpId]);

  const addManualDate = () => {
    if (!tempManualDate) return;
    if (!manualDates.includes(tempManualDate)) {
      setManualDates([...manualDates, tempManualDate].sort());
    }
    setTempManualDate('');
  };

  const removeManualDate = (dateToRemove: string) => {
    setManualDates(manualDates.filter(d => d !== dateToRemove));
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const openNewModal = () => {
    setEditingId(null);
    setSelectedEmpId('');
    setReasonCategory('');
    setReason('');
    setObservation('');
    setDate('');
    setStartDate('');
    setEndDate('');
    setManualDates([]);
    setStartTime('');
    setEndTime('');
    setIsFullDay(false);
    setAbsenceType('single');
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
    
    // Logic to determine dropdown state based on saved reason
    if (REASON_OPTIONS.includes(abs.reason)) {
      setReasonCategory(abs.reason);
      setReason(abs.reason);
    } else {
      setReasonCategory('Outros');
      setReason(abs.reason);
    }
    
    setObservation(abs.observation);
    
    const isRange = abs.date !== abs.endDate;
    
    if (isRange) {
        setAbsenceType('range');
        setStartDate(abs.date);
        setEndDate(abs.endDate);
        setDate('');
    } else {
        setAbsenceType('single');
        setDate(abs.date);
        setStartDate('');
        setEndDate('');
    }
    
    const emp = employees.find(e => e.id === abs.employeeId);
    if (emp && abs.startTime === emp.shiftStart && abs.endTime === emp.shiftEnd) {
      setIsFullDay(true);
      setStartTime('');
      setEndTime('');
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
        await deleteAbsence(deleteConfirmationId);
        await loadData(); // Reload from DB
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
        observation 
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
          // Updating existing record
          const existing = absences.find(a => a.id === editingId);
          
          let updateDate = date;
          let updateEndDate = date;

          if (absenceType === 'range') {
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
              updatedAt: new Date().toISOString()
          };
          
          await saveAbsence(updatedAbsence);
      } else {
          // Creating new record(s)
          // We pass ID as empty string so backend generates UUID
          const auditInfo = {
              createdBy: currentUser.name,
              createdAt: new Date().toISOString()
          };

          const newAbsences: Absence[] = [];

          if (absenceType === 'range') {
              newAbsences.push({
                  id: '',
                  ...commonData,
                  ...auditInfo,
                  date: startDate,
                  endDate: endDate
              });
          } else if (absenceType === 'single') {
              newAbsences.push({
                  id: '',
                  ...commonData,
                  ...auditInfo,
                  date: date,
                  endDate: date
              });
          } else if (absenceType === 'multi') {
              manualDates.forEach((d: string) => {
                  newAbsences.push({
                    id: '',
                    ...commonData,
                    ...auditInfo,
                    date: d,
                    endDate: d
                  });
              });
          }
          
          // Save all concurrently
          await Promise.all(newAbsences.map(abs => saveAbsence(abs)));
      }

      await loadData(); // Refresh list
      
      // Close modal and reset
      setWarningModalOpen(false);
      setPendingAbsenceData(null);
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar os dados. Tente novamente.");
    }
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    // Validate Reason
    if (!reason || reason.trim() === '') {
        setError('Por favor, informe o motivo da ausência.');
        return;
    }

    // 1. Time Calculation & Validation
    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (isFullDay) {
      finalStartTime = emp.shiftStart;
      finalEndTime = emp.shiftEnd;
    } else {
      if (!finalStartTime || !finalEndTime) {
        setError('Os campos Hora Início e Hora Fim são obrigatórios.');
        return;
      }

      // Check Shift Bounds
      if (finalStartTime < emp.shiftStart || finalEndTime > emp.shiftEnd) {
        setError(`O horário da ausência deve estar dentro do expediente do funcionário (${emp.shiftStart} às ${emp.shiftEnd}).`);
        return;
      }

      // Check logical order
      if (finalStartTime >= finalEndTime) {
        setError('A Hora Fim deve ser posterior à Hora Início.');
        return;
      }
    }

    const startMins = timeToMinutes(finalStartTime);
    const endMins = timeToMinutes(finalEndTime);
    const finalDuration = endMins - startMins;

    // 2. Determine Target Dates for Coverage Checking
    let targetDates: string[] = [];
    
    if (absenceType === 'single') {
        if (!date) { setError('Selecione uma data.'); return; }
        targetDates = [date];
    } else if (absenceType === 'range') {
        if (!startDate || !endDate) { setError('Selecione data de início e fim.'); return; }
        if (startDate > endDate) { setError('A data de início deve ser anterior à data fim.'); return; }
        
        let current = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        while (current <= end) {
            targetDates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
    } else if (absenceType === 'multi') {
        if (manualDates.length === 0) { setError('Adicione pelo menos uma data.'); return; }
        targetDates = manualDates;
    }

    // 3. Prepare Payload
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
      observation
    };

    // 4. Validate Coverage
    // Note: checkCoverage checks against currently loaded employees/absences state.
    // Ensure dbService's implementation logic supports passing state if needed, 
    // or assumes the backend logic will handle this in future.
    let missingCoverageDates: string[] = [];
    for (const d of targetDates) {
      const hasCoverage = checkCoverage(emp.id, emp.role, emp.squad, d, finalStartTime, finalEndTime);
      if (!hasCoverage) {
        missingCoverageDates.push(d);
      }
    }

    if (missingCoverageDates.length > 0) {
      setWarningMessage(`Atenção: Não há outro funcionário (Backup) com cargo "${emp.role}" disponível na Squad "${emp.squad}" para cobrir o horário solicitado nas seguintes datas: ${missingCoverageDates.join(', ')}.`);
      setPendingAbsenceData(dataToSave);
      setWarningModalOpen(true);
      return;
    }

    // 5. Save if no warning
    executeSave(dataToSave);
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

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
    // Include semicolon in checks
    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
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
      'Funcionário', 'Cargo', 'Motivo', 'Data Início', 'Data Fim', 
      'Hora Início', 'Hora Fim', 'Duração (min)', 'Observação',
      'Registrado Por', 'Data Registro', 'Atualizado Por', 'Data Atualização'
    ];
    
    const rows = filteredAbsences.map(abs => {
      const emp = employees.find(e => e.id === abs.employeeId);
      return [
        escapeCsv(emp ? `${emp.firstName} ${emp.lastName}` : 'Desconhecido'),
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
        escapeCsv(abs.updatedAt)
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
    link.setAttribute('download', `ausencias_smarttime_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E]">Controle de Ausências</h1>
          <p className="text-slate-500">Registre saídas antecipadas, faltas ou férias.</p>
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
            <span className="hidden sm:inline">Nova Ausência</span>
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
                    
                    <div>
                        <label className="text-xs font-bold text-[#3F3F3F] mb-1 block">Motivo</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Férias, Médico..." 
                            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-[#204294]"
                            value={filters.reason}
                            onChange={(e) => setFilters({...filters, reason: e.target.value})}
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
            <h3 className="font-semibold text-slate-700">Histórico de Registros</h3>
            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                Total: {filteredAbsences.length}
            </span>
        </div>
        
        {filteredAbsences.length === 0 ? (
             <div className="text-center p-12 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Calendar size={32} />
                </div>
                <p>Nenhum registro encontrado com os filtros selecionados.</p>
                {absences.length > 0 && (
                    <button onClick={clearFilters} className="text-[#204294] font-medium hover:underline mt-2">
                        Limpar filtros
                    </button>
                )}
            </div>
        ) : (
            <div className="divide-y divide-slate-100">
            {filteredAbsences.slice().reverse().map(abs => {
                const emp = employees.find(e => e.id === abs.employeeId);
                const isRange = abs.date !== abs.endDate;
                
                // Determine Audit Info
                const auditUser = abs.updatedBy || abs.createdBy || 'Sistema';
                const auditDate = abs.updatedAt || abs.createdAt;
                const auditLabel = abs.updatedBy ? 'Atualizado por' : 'Registrado por';

                return (
                <div 
                    key={abs.id} 
                    onClick={() => handleEdit(abs)}
                    className="p-4 hover:bg-[#204294]/5 transition-all duration-200 cursor-pointer group hover:shadow-sm"
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
                             <div className="text-sm font-medium text-slate-700">{abs.reason}</div>
                             <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                {isRange ? (
                                    <div className="flex items-center gap-1 bg-[#204294]/10 px-2 py-0.5 rounded text-[#204294] font-medium border border-[#204294]/20">
                                        <CalendarRange size={12} /> 
                                        {abs.date} <span className="text-slate-400">até</span> {abs.endDate}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        <Calendar size={12} /> {abs.date}
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
                                    requestDelete(abs.id);
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
                        {editingId ? 'Editar Ausência' : 'Nova Ausência'}
                    </h3>
                    <p className="text-sm text-slate-500">Preencha os dados da ocorrência.</p>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleRequest} className="space-y-5">
                    
                    {/* Employee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Funcionário <span className="text-rose-500">*</span></label>
                        <select 
                            required 
                            disabled={!!editingId} // Lock employee when editing
                            className={`w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none bg-white text-slate-900 ${editingId ? 'bg-slate-100 text-slate-500' : ''}`}
                            value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.role})</option>
                            ))}
                        </select>
                        {selectedEmployee && (
                            <p className="text-xs text-[#204294] mt-1 font-medium bg-[#204294]/10 inline-block px-2 py-1 rounded">
                            Expediente Padrão: {selectedEmployee.shiftStart} às {selectedEmployee.shiftEnd}
                            </p>
                        )}
                    </div>

                    {/* Absence Type Selector */}
                    {!editingId && (
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Ausência <span className="text-rose-500">*</span></label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button type="button" 
                            onClick={() => setAbsenceType('single')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${absenceType === 'single' ? 'bg-white text-[#204294] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Calendar size={16} /> Dia Único
                            </button>
                            <button type="button" 
                            onClick={() => setAbsenceType('range')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${absenceType === 'range' ? 'bg-white text-[#204294] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <CalendarRange size={16} /> Período
                            </button>
                            <button type="button" 
                            onClick={() => setAbsenceType('multi')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${absenceType === 'multi' ? 'bg-white text-[#204294] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <CalendarDays size={16} /> Dias
                            </button>
                        </div>
                        </div>
                    )}

                    {/* Dynamic Date Inputs based on Type */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {absenceType === 'single' && (
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data da Ausência <span className="text-rose-500">*</span></label>
                        <input required type="date" className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                            value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    )}

                    {absenceType === 'range' && (
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
                    )}

                    {absenceType === 'multi' && (
                        <div>
                        {editingId ? (
                            <div className="text-sm text-rose-500 bg-rose-50 p-2 rounded">
                                Edição de múltiplos dias não suportada em lote. Edite cada registro individualmente.
                            </div>
                        ) : (
                            <>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Dias <span className="text-rose-500">*</span></label>
                            <div className="flex gap-2 mb-3">
                                <input type="date" className="flex-1 border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                                value={tempManualDate} onChange={e => setTempManualDate(e.target.value)} />
                                <button type="button" onClick={addManualDate} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 rounded-lg">
                                <Plus size={20} />
                                </button>
                            </div>
                            {manualDates.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                {manualDates.map(d => (
                                    <span key={d} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-md text-sm text-slate-600">
                                    {d} <button type="button" onClick={() => removeManualDate(d)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                    </span>
                                ))}
                                </div>
                            )}
                            {manualDates.length === 0 && <span className="text-xs text-slate-400">Nenhum dia selecionado.</span>}
                            </>
                        )}
                        </div>
                    )}
                    </div>

                    {/* Time Configuration */}
                    <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Horário</label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={isFullDay} onChange={e => setIsFullDay(e.target.checked)} 
                            className="w-4 h-4 text-[#204294] rounded focus:ring-[#204294]" />
                        <span className="text-sm text-slate-600">Dia Inteiro (Turno Completo)</span>
                        </label>
                    </div>
                    
                    {!isFullDay ? (
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Hora Início <span className="text-rose-500">*</span></label>
                            <input 
                            required 
                            type="time" 
                            min={selectedEmployee?.shiftStart}
                            max={selectedEmployee?.shiftEnd}
                            className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                            value={startTime} 
                            onChange={e => setStartTime(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Hora Fim <span className="text-rose-500">*</span></label>
                            <input 
                            required 
                            type="time" 
                            min={startTime || selectedEmployee?.shiftStart}
                            max={selectedEmployee?.shiftEnd}
                            className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294] bg-white text-slate-900"
                            value={endTime} 
                            onChange={e => setEndTime(e.target.value)} 
                            />
                        </div>
                        </div>
                    ) : (
                        <div className="bg-[#204294]/10 border border-[#204294]/20 rounded-lg p-3 text-sm text-[#204294] flex gap-2">
                        <Clock size={18} className="flex-shrink-0" />
                        <p>
                            A ausência será registrada das <strong>{selectedEmployee?.shiftStart || '--:--'}</strong> às <strong>{selectedEmployee?.shiftEnd || '--:--'}</strong>.
                        </p>
                        </div>
                    )}
                    </div>

                    {/* New Reason Logic */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo <span className="text-rose-500">*</span></label>
                        <select 
                            required
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none bg-white text-slate-900"
                            value={reasonCategory} 
                            onChange={(e) => {
                                const val = e.target.value;
                                setReasonCategory(val);
                                if (val !== 'Outros') {
                                    setReason(val);
                                } else {
                                    setReason(''); // Clear text for custom input
                                }
                            }}
                        >
                            <option value="">Selecione um motivo...</option>
                            {REASON_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    {reasonCategory === 'Outros' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Detalhe o motivo <span className="text-rose-500">*</span></label>
                            <input 
                                required 
                                type="text" 
                                placeholder="Descreva o motivo específico..." 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none bg-white text-slate-900"
                                value={reason} 
                                onChange={e => setReason(e.target.value)} 
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Observação <span className="text-xs text-slate-400 font-normal">(Opcional)</span></label>
                        <textarea rows={3} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#204294] outline-none bg-white text-slate-900"
                        value={observation} onChange={e => setObservation(e.target.value)}></textarea>
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
                  <button onClick={handleRequest} className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] transition-colors shadow-sm font-bold">
                    {editingId ? 'Salvar Alterações' : 'Registrar Ausência'}
                  </button>
              </div>
          </div>
        </div>
      )}

      {/* Warning Confirmation Modal (Coverage) - Higher Z-Index */}
      {warningModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center animate-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Conflito de Escala</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              {warningMessage}
            </p>
            <p className="text-slate-500 mb-6 text-sm font-medium">
              Deseja prosseguir com o registro mesmo assim?
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => {
                  setWarningModalOpen(false);
                  setPendingAbsenceData(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium border border-slate-200"
              >
                Voltar e Corrigir
              </button>
              <button 
                onClick={() => executeSave(pendingAbsenceData)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm font-medium"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Ausência?</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Esta ação não pode ser desfeita. A ausência será removida do histórico.
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

export default AbsenceManager;