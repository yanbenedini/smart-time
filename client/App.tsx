import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  Menu,
  ArrowLeftRight,
  UserCog,
  Phone,
  LogOut,
  ChevronUp,
  Lock,
  X,
  Check,
  AlertCircle,
  ScrollText,
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import EmployeeManager from "./components/EmployeeManager";
import AbsenceManager from "./components/AbsenceManager";
import ShiftChangeManager from "./components/ShiftChangeManager";
import UserManager from "./components/UserManager";
import OnCallManager from "./components/OnCallManager";
import LogManager from "./components/LogManager";
import Login from "./components/Login";
import { SystemUser } from "./types";
import { saveSystemUser, changePassword } from "./services/dbService";

enum View {
  DASHBOARD,
  EMPLOYEES,
  ABSENCES,
  SHIFT_CHANGES,
  ON_CALL,
  USERS,
  LOGS,
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("smarttime_user");
    const storedAuth = localStorage.getItem("smarttime_auth");

    if (storedUser && storedAuth) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Atualiza o estado, evitando que a tela de Login apareça
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);
        // Se os dados estiverem corrompidos, limpa tudo para forçar novo login limpo
        localStorage.removeItem("smarttime_user");
        localStorage.removeItem("smarttime_auth");
      }
    }
  }, []);

  // Check for forced password change on login
  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setIsPasswordModalOpen(true);
      setProfileMenuOpen(false);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("smarttime_auth"); // Remove o token
    localStorage.removeItem("smarttime_user"); // Remove os dados do usuário
    setProfileMenuOpen(false);
    setCurrentUser(null);
    setCurrentView(View.DASHBOARD);
  };

  const openPasswordModal = () => {
    setProfileMenuOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordFeedback(null);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    // 1. Validações básicas de formulário (Frontend)
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "A nova senha e a confirmação não coincidem.",
      });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordFeedback({
        type: "error",
        message: "A nova senha deve ter pelo menos 4 caracteres.",
      });
      return;
    }

    // OBS: Removemos a checagem local da senha antiga.
    // Quem vai dizer se a senha antiga está certa é o Backend.

    try {
      if (!currentUser?.id) return;

      // 2. Chama a rota segura que valida o Hash no servidor
      await changePassword(
        currentUser.id,
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );

      // 3. Atualiza o estado local apenas para liberar a tela (sem expor a senha)
      setCurrentUser({
        ...currentUser,
        mustChangePassword: false,
      });

      setPasswordFeedback({
        type: "success",
        message: "Senha alterada com sucesso!",
      });

      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordFeedback(null);
        // Opcional: Limpar o form
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }, 1500);
    } catch (err: any) {
      // 4. Se a senha antiga estiver errada, o backend retorna erro 401
      // e cai aqui. Mostramos a mensagem do servidor.
      setPasswordFeedback({
        type: "error",
        message:
          err.message || "Erro ao alterar a senha. Verifique a senha atual.",
      });
    }
  };

  const NavItem = ({
    view,
    icon: Icon,
    label,
  }: {
    view: View;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
        currentView === view
          ? "bg-[#204294] text-white shadow-md shadow-blue-900/20"
          : "text-[#3F3F3F] hover:bg-slate-100"
      }`}
    >
      <Icon
        size={20}
        className={currentView === view ? "text-white" : "text-[#204294]"}
      />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="mb-10">
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-[#204294] tracking-tight leading-none">
                CCM
              </span>
              <span className="text-xs font-medium text-[#00B0EA] tracking-widest uppercase mt-1">
                Smart Time
              </span>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem
              view={View.DASHBOARD}
              icon={LayoutDashboard}
              label="Dashboard"
            />
            <NavItem view={View.EMPLOYEES} icon={Users} label="Funcionários" />
            <NavItem view={View.ABSENCES} icon={Clock} label="Ausências" />
            <NavItem
              view={View.SHIFT_CHANGES}
              icon={ArrowLeftRight}
              label="Trocas"
            />
            <NavItem view={View.ON_CALL} icon={Phone} label="Plantões" />

            {currentUser.isAdmin && (
              <div className="pt-4 mt-4 border-t border-slate-100 animate-in fade-in">
                <p className="px-3 text-[10px] font-bold text-[#00B0EA] uppercase tracking-wider mb-2">
                  Administração
                </p>
                <NavItem view={View.USERS} icon={UserCog} label="Usuários" />
                <NavItem
                  view={View.LOGS}
                  icon={ScrollText}
                  label="Logs do Sistema"
                />
              </div>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-100 relative">
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden z-50">
                <button
                  onClick={openPasswordModal}
                  className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-medium border-b border-slate-50"
                >
                  <Lock size={16} />
                  Alterar Senha
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut size={16} />
                  Sair do sistema
                </button>
              </div>
            )}

            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2 select-none group"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div className="w-10 h-10 rounded-full bg-[#E5E5E5] border border-slate-200 flex items-center justify-center text-[#204294] font-bold group-hover:bg-[#204294] group-hover:text-white transition-colors">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1E1E1E] truncate group-hover:text-[#204294] transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser.email}
                </p>
              </div>
              <ChevronUp
                size={16}
                className={`text-slate-400 transition-transform ${
                  profileMenuOpen ? "" : "rotate-180"
                }`}
              />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-extrabold text-[#204294] tracking-tight">
              CCM
            </span>
            <span className="text-[10px] font-medium text-[#00B0EA] tracking-widest uppercase">
              Smart Time
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#204294] rounded-lg hover:bg-slate-100"
          >
            <Menu size={24} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentView === View.DASHBOARD && <Dashboard />}
          {currentView === View.EMPLOYEES && (
            <EmployeeManager currentUser={currentUser} />
          )}
          {currentView === View.ABSENCES && (
            <AbsenceManager currentUser={currentUser} />
          )}
          {currentView === View.SHIFT_CHANGES && (
            <ShiftChangeManager currentUser={currentUser} />
          )}
          {currentView === View.ON_CALL && (
            <OnCallManager currentUser={currentUser} />
          )}
          {currentUser.isAdmin && currentView === View.USERS && (
            <UserManager currentUser={currentUser} />
          )}
          {currentUser.isAdmin && currentView === View.LOGS && (
            <LogManager currentUser={currentUser} />
          )}
        </main>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200 border-t-4 border-[#204294]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center gap-2">
                <Lock size={18} className="text-[#204294]" />
                {currentUser.mustChangePassword
                  ? "Alteração Obrigatória"
                  : "Redefinir Senha"}
              </h3>
              {!currentUser.mustChangePassword && (
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {currentUser.mustChangePassword && (
                <div className="block text-sm font-medium text-slate-700 mb-1">
                  Você deve alterar sua senha para continuar.
                </div>
              )}

              {passwordFeedback && (
                <div
                  className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                    passwordFeedback.type === "error"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  {passwordFeedback.type === "error" ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Check size={18} />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Senha Atual
                </label>
                <input
                  required
                  type="password"
                  title="Senha atual"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294]"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nova Senha
                </label>
                <input
                  required
                  type="password"
                  title="Nova senha"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294]"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  required
                  type="password"
                  title="Confirmar nova senha"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-[#204294]"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                {!currentUser.mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
