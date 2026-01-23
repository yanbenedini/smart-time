import React from "react";
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
    ScrollText,
    Moon,
    Sun,
} from "lucide-react";
import { SystemUser, View } from "../types";
import { useTheme } from "../context/ThemeContext";

interface SidebarProps {
    currentUser: SystemUser;
    currentView: View;
    setCurrentView: (view: View) => void;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    profileMenuOpen: boolean;
    setProfileMenuOpen: (open: boolean) => void;
    handleLogout: () => void;
    openPasswordModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentUser,
    currentView,
    setCurrentView,
    mobileMenuOpen,
    setMobileMenuOpen,
    profileMenuOpen,
    setProfileMenuOpen,
    handleLogout,
    openPasswordModal,
}) => {
    const { theme, toggleTheme } = useTheme();

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
            className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${currentView === view
                ? "bg-[#204294] text-white shadow-md shadow-blue-900/20"
                : "text-[#3F3F3F] dark:text-slate-400 dark:hover:bg-slate-900 hover:bg-slate-200"
                }`}
        >
            <Icon
                size={20}
                className={currentView === view ? "text-white" : "text-[#204294] dark:text-blue-400"}
            />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                } dark:bg-slate-800 dark:border-slate-700`}
        >
            <div className="h-full flex flex-col p-6">
                <div className="mb-10">
                    <div className="flex flex-col">
                        <span className="text-3xl font-extrabold text-[#204294] tracking-tight leading-none dark:text-blue-400">
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
                        <div className="pt-4 mt-4 border-t border-slate-500 animate-in fade-in">
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

                <div className="pt-3 border-t border-slate-500 relative">
                    {profileMenuOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden z-50 dark:bg-slate-800 dark:border-slate-700">
                            <button
                                onClick={toggleTheme}
                                className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-medium border-b border-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
                            >
                                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                                {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                            </button>
                            <button
                                onClick={openPasswordModal}
                                className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-medium border-b border-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
                            >
                                <Lock size={16} />
                                Alterar Senha
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium dark:hover:bg-slate-700"
                            >
                                <LogOut size={16} />
                                Sair do sistema
                            </button>
                        </div>
                    )}

                    <div
                        className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2 select-none group dark:hover:bg-slate-700"
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    >
                        <div className="w-10 h-10 rounded-full bg-[#E5E5E5] border border-slate-200 flex items-center justify-center text-[#204294] font-bold group-hover:bg-[#204294] group-hover:text-white transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#1E1E1E] truncate group-hover:text-[#204294] transition-colors dark:text-slate-200 dark:group-hover:text-blue-400">
                                {currentUser.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate dark:text-slate-400">
                                {currentUser.email}
                            </p>
                        </div>
                        <ChevronUp
                            size={16}
                            className={`text-slate-400 transition-transform ${profileMenuOpen ? "" : "rotate-180"
                                }`}
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
