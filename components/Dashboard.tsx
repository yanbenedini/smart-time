import React, { useEffect, useState } from "react";
import {
  Users,
  CalendarOff,
  UserMinus,
  Clock,
  CheckCircle,
  ArrowLeftRight,
  ArrowRight,
  Palmtree,
  Calendar,
  Phone,
} from "lucide-react";
import {
  getEmployees,
  getAbsences,
  getShiftChanges,
  getOnCallShifts,
} from "../services/dbService";
import { Employee, Absence, ShiftChange, OnCallShift } from "../types";
import { IonSkeletonText } from "@ionic/react";

const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [shiftChanges, setShiftChanges] = useState<ShiftChange[]>([]);
  const [onCallShifts, setOnCallShifts] = useState<OnCallShift[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [emps, abs, shifts, onCalls] = await Promise.all([
          getEmployees(),
          getAbsences(),
          getShiftChanges(),
          getOnCallShifts(),
        ]);

        setEmployees(emps);
        setAbsences(abs);
        setShiftChanges(shifts);
        setOnCallShifts(onCalls);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        // Delay para transição suave
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    loadDashboardData();
  }, []);

  // Helper to get today's date in YYYY-MM-DD local time
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();

  // Calculate date 30 days from now for On Call filter
  const getNextMonthString = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const nextMonthStr = getNextMonthString();

  // Filter absences for today
  const todaysAbsences = absences.filter(
    (a) => todayStr >= a.date && todayStr <= a.endDate
  );

  // Filter specific vacation absences for today
  const vacationAbsences = todaysAbsences.filter((a) => a.reason === "Férias");

  // Filter shift changes for today
  const todaysShiftChanges = shiftChanges.filter(
    (c) => todayStr >= c.startDate && todayStr <= c.endDate
  );

  // Filter upcoming on-call shifts (Today -> Next 30 Days)
  const upcomingOnCalls = onCallShifts
    .filter((s) => s.date >= todayStr && s.date <= nextMonthStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col h-full gap-4 pb-4">
      <header className="flex-shrink-0">
        <h1 className="text-xl font-bold text-[#1E1E1E]">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Visão geral da empresa e métricas.
        </p>
      </header>

      {/* TOP SECTION: Stats in Single Line (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        {/* Card 1: Funcionários */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="p-2.5 bg-[#204294]/10 rounded-lg text-[#204294]">
              <Users size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Funcionários
              </p>
              <h3 className="text-xl font-bold text-[#1E1E1E]">
                {isLoading ? (
                  <IonSkeletonText
                    animated
                    style={{ width: "40px", height: "20px" }}
                  />
                ) : (
                  employees.length
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2: Ausências Totais */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
              <CalendarOff size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Ausências Totais
              </p>
              <h3 className="text-xl font-bold text-[#1E1E1E]">
                {isLoading ? (
                  <IonSkeletonText
                    animated
                    style={{ width: "40px", height: "20px" }}
                  />
                ) : (
                  absences.length
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 3: Ausentes Hoje */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="p-2.5 bg-orange-50 rounded-lg text-orange-600">
              <UserMinus size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Ausentes Hoje
              </p>
              <h3 className="text-xl font-bold text-[#1E1E1E]">
                {isLoading ? (
                  <IonSkeletonText
                    animated
                    style={{ width: "40px", height: "20px" }}
                  />
                ) : (
                  todaysAbsences.length
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 4: Trocas Hoje */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="p-2.5 bg-[#00B0EA]/10 rounded-lg text-[#00B0EA]">
              <ArrowLeftRight size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Trocas Hoje
              </p>
              <h3 className="text-xl font-bold text-[#1E1E1E]">
                {isLoading ? (
                  <IonSkeletonText
                    animated
                    style={{ width: "40px", height: "20px" }}
                  />
                ) : (
                  todaysShiftChanges.length
                )}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Lists Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Box 1: Absent Today List */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
              <UserMinus size={16} className="text-rose-500" />
              Ausentes Hoje
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {todayStr}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {isLoading ? (
              // Skeletons para Ausentes Hoje
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`sk-abs-${i}`}
                  className="p-2 border border-slate-100 rounded-lg bg-slate-50"
                >
                  <div className="flex justify-between mb-1">
                    <IonSkeletonText
                      animated
                      style={{ width: "60%", height: "10px" }}
                    />
                    <IonSkeletonText
                      animated
                      style={{ width: "20%", height: "10px" }}
                    />
                  </div>
                  <IonSkeletonText
                    animated
                    style={{ width: "40%", height: "8px" }}
                  />
                </div>
              ))
            ) : todaysAbsences.length > 0 ? (
              todaysAbsences.map((abs) => {
                const emp = employees.find((e) => e.id === abs.employeeId);
                return (
                  <div
                    key={abs.id}
                    className="p-2 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold text-[#1E1E1E] text-xs truncate max-w-[120px]">
                        {emp ? `${emp.firstName} ${emp.lastName}` : "Excluído"}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-white px-1 rounded border border-slate-200">
                        {emp?.role.substring(0, 3)}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-600 font-medium mb-0.5 truncate">
                      {abs.reason}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={10} />
                      {abs.startTime} - {abs.endTime}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <div className="w-8 h-8 bg-[#01B8A1]/10 text-[#01B8A1] rounded-full flex items-center justify-center mb-1">
                  <CheckCircle size={16} />
                </div>
                <p className="text-[11px]">Todos presentes hoje.</p>
              </div>
            )}
          </div>
        </div>

        {/* Box 2: Vacation Today List */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
              <Palmtree size={16} className="text-emerald-500" />
              Em Férias
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {todayStr}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {isLoading ? (
              // Skeletons para Em Férias
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`sk-vac-${i}`}
                  className="p-2 border border-emerald-100 rounded-lg bg-emerald-50"
                >
                  <div className="flex justify-between mb-1">
                    <IonSkeletonText
                      animated
                      style={{ width: "60%", height: "10px" }}
                    />
                    <IonSkeletonText
                      animated
                      style={{ width: "20%", height: "10px" }}
                    />
                  </div>
                  <IonSkeletonText
                    animated
                    style={{ width: "50%", height: "8px" }}
                  />
                </div>
              ))
            ) : vacationAbsences.length > 0 ? (
              vacationAbsences.map((abs) => {
                const emp = employees.find((e) => e.id === abs.employeeId);
                return (
                  <div
                    key={abs.id}
                    className="p-2 border border-emerald-100 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold text-[#1E1E1E] text-xs truncate max-w-[120px]">
                        {emp ? `${emp.firstName} ${emp.lastName}` : "Excluído"}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-white px-1 rounded border border-slate-200">
                        {emp?.role.substring(0, 3)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <Calendar size={10} />
                      {abs.date === abs.endDate
                        ? abs.date
                        : `${abs.date} até ${abs.endDate}`}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-1">
                  <Palmtree size={16} />
                </div>
                <p className="text-[11px]">Ninguém em férias hoje.</p>
              </div>
            )}
          </div>
        </div>

        {/* Box 3: Shift Changes Today List */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-[#00B0EA]" />
              Trocas Hoje
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {todayStr}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {isLoading ? (
              // Skeletons para Trocas Hoje
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`sk-shift-${i}`}
                  className="p-2 border border-slate-100 rounded-lg bg-slate-50"
                >
                  <IonSkeletonText
                    animated
                    style={{ width: "70%", height: "10px" }}
                  />
                  <IonSkeletonText
                    animated
                    style={{ width: "90%", height: "14px", marginTop: "8px" }}
                  />
                </div>
              ))
            ) : todaysShiftChanges.length > 0 ? (
              todaysShiftChanges.map((change) => {
                const emp = employees.find((e) => e.id === change.employeeId);
                return (
                  <div
                    key={change.id}
                    className="p-2 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold text-[#1E1E1E] text-xs truncate max-w-[120px]">
                        {emp ? `${emp.firstName} ${emp.lastName}` : "Excluído"}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-white px-1 rounded border border-slate-200">
                        {emp?.role.substring(0, 3)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-1 truncate">
                      {change.reason}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] bg-white p-1 rounded border border-slate-100">
                      <span className="text-slate-400 line-through decoration-rose-300">
                        {change.originalShiftStart} - {change.originalShiftEnd}
                      </span>
                      <ArrowRight size={8} className="text-slate-400" />
                      <span className="font-bold text-[#204294]">
                        {change.newShiftStart} - {change.newShiftEnd}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <div className="w-8 h-8 bg-[#00B0EA]/10 text-[#00B0EA] rounded-full flex items-center justify-center mb-1">
                  <CheckCircle size={16} />
                </div>
                <p className="text-[11px]">Nenhuma troca hoje.</p>
              </div>
            )}
          </div>
        </div>

        {/* Box 4: Upcoming On-Call Shifts */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
              <Phone size={16} className="text-indigo-500" />
              Próximos Plantões
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              Próx. 30 dias
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {isLoading ? (
              // Skeletons para Plantões
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`sk-call-${i}`}
                  className="p-2 border border-slate-100 rounded-lg bg-slate-50"
                >
                  <IonSkeletonText
                    animated
                    style={{ width: "60%", height: "10px" }}
                  />
                  <IonSkeletonText
                    animated
                    style={{ width: "40%", height: "8px", marginTop: "6px" }}
                  />
                  <IonSkeletonText
                    animated
                    style={{ width: "40%", height: "8px", marginTop: "4px" }}
                  />
                </div>
              ))
            ) : upcomingOnCalls.length > 0 ? (
              upcomingOnCalls.map((shift) => {
                const emp = employees.find((e) => e.id === shift.employeeId);
                const isToday = shift.date === todayStr;
                return (
                  <div
                    key={shift.id}
                    className={`p-2 border rounded-lg transition-colors ${
                      isToday
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold text-[#1E1E1E] text-xs truncate max-w-[120px]">
                        {emp ? `${emp.firstName} ${emp.lastName}` : "Excluído"}
                      </span>
                      {isToday && (
                        <span className="text-[9px] uppercase font-bold text-white bg-indigo-500 px-1.5 py-0 rounded">
                          Hoje
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-0.5">
                      <Calendar
                        size={10}
                        className={
                          isToday ? "text-indigo-500" : "text-slate-400"
                        }
                      />
                      <span
                        className={isToday ? "font-bold text-indigo-700" : ""}
                      >
                        {shift.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={10} />
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-1">
                  <Phone size={16} />
                </div>
                <p className="text-[11px]">Nenhum plantão próximo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
