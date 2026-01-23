import React, { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Mail,
  Key,
  X,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { SystemUser } from "../types";
import {
  getSystemUsers,
  saveSystemUser,
  deleteSystemUser,
} from "../services/dbService";
import { IonSkeletonText } from "@ionic/react";

interface UserManagerProps {
  currentUser: SystemUser;
}

const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = !!currentUser.isSuperAdmin;

  const [isLoading, setIsLoading] = useState(true);

  // --- DATA LOADING (ASYNC) ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getSystemUsers();
      setUsers(data);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      // Pequeno atraso para suavizar a transição visual
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("123Mudar");
    setIsAdmin(false);
    setShowPassword(false);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: SystemUser) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password);
    setIsAdmin(user.isAdmin);
    setShowPassword(false);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    // Validação local de duplicidade
    const duplicate = users.find(
      (u) => u.email === email && u.id !== editingId
    );
    if (duplicate) {
      setError("Este email já está cadastrado.");
      return;
    }

    const newUser: SystemUser = {
      id: editingId || "",
      name,
      email,
      password,
      // Só o Super Admin pode promover alguém a Admin
      isAdmin: isSuperAdmin
        ? isAdmin
        : editingId
          ? users.find((u) => u.id === editingId)?.isAdmin || false
          : false,
      mustChangePassword: editingId
        ? users.find((u) => u.id === editingId)?.mustChangePassword
        : true,
      // Segurança máxima: isSuperAdmin só pode ser mantido, nunca criado via formulário
      isSuperAdmin: editingId
        ? users.find((u) => u.id === editingId)?.isSuperAdmin
        : false,
    };

    try {
      // CORREÇÃO AQUI: Passando currentUser.name para o log funcionar
      await saveSystemUser(newUser, currentUser.name);
      await loadData();
      closeModal();
    } catch (err) {
      setError("Erro ao salvar usuário. Tente novamente.");
    }
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      try {
        // CORREÇÃO AQUI: Passando currentUser.name para o log funcionar
        await deleteSystemUser(deleteConfirmationId, currentUser.name);
        await loadData();
        setDeleteConfirmationId(null);
      } catch (err) {
        alert("Erro ao excluir usuário.");
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    // 1. Regra de Ouro: Nunca mostrar o próprio usuário logado
    if (user.id === currentUser.id) return false;

    // 2. Se o logado for Super Admin: Vê todo o resto (Admins e Membros)
    if (isSuperAdmin) return true;

    // 3. Se o logado for Admin comum:
    if (currentUser.isAdmin) {
      // SÓ pode ver quem NÃO é admin e NÃO é super admin (ou seja, apenas Membros)
      return !user.isAdmin && !user.isSuperAdmin;
    }

    // 4. Se for um usuário comum (Membro): Não deveria nem acessar esta tela,
    // mas por segurança, retornamos vazio.
    return false;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">
            Usuários do Sistema
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie quem tem acesso ao Smart Time.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-[#204294] hover:bg-[#1a367a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-bold dark:bg-blue-600 dark:hover:bg-blue-700"
          title="Adicionar Usuário"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center dark:bg-slate-700/50 dark:border-slate-700">
          <h3 className="font-semibold text-slate-700 dark:text-white">Contas Cadastradas</h3>
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-300">
            Visualizando: {filteredUsers.length}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {isLoading ? (
            // --- ESTADO CARREGANDO (SKELETONS) ---
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-user-${i}`} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar Skeleton */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                    <div className="space-y-2">
                      {/* Name Skeleton */}
                      <IonSkeletonText
                        animated
                        style={{ width: "120px", height: "12px" }}
                      />
                      {/* Email Skeleton */}
                      <IonSkeletonText
                        animated
                        style={{ width: "180px", height: "10px" }}
                      />
                    </div>
                  </div>
                  {/* Action Button Skeleton */}
                  <div className="w-8 h-8 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))
          ) : filteredUsers.length > 0 ? (
            // --- LISTA REAL DE DADOS ---
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleEdit(user)}
                className="p-4 hover:bg-[#204294]/5 transition-colors duration-200 cursor-pointer group hover:shadow-sm dark:hover:bg-[#204294]/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user.isAdmin
                        ? "bg-[#204294]/10 text-[#204294] dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#1E1E1E] flex items-center gap-2 dark:text-white">
                        {user.name}
                        {user.isAdmin && (
                          <Shield size={14} className="text-[#204294] dark:text-blue-400" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDelete(user.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors dark:text-slate-500 dark:hover:bg-rose-900/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // --- ESTADO VAZIO ---
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Nenhum outro usuário encontrado.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200 dark:bg-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center gap-2 dark:text-white">
                {editingId ? <Edit2 size={18} className="dark:text-blue-400" /> : <Plus size={18} className="dark:text-blue-400" />}
                {editingId ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserCog
                    size={18}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    required
                    type="text"
                    className="w-full border border-slate-300 rounded-lg pl-10 p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    required
                    type="email"
                    className="w-full border border-slate-300 rounded-lg pl-10 p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                  Senha
                </label>
                <div className="relative">
                  <Key
                    size={18}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-slate-300 rounded-lg pl-10 pr-10 p-2 outline-none focus:border-[#204294] dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="w-4 h-4 text-[#204294] rounded focus:ring-[#204294] dark:bg-slate-700 dark:border-slate-600"
                  />
                  <label htmlFor="isAdmin" className="text-sm text-slate-700 dark:text-slate-300">
                    Este usuário é Administrador?
                  </label>
                </div>
              )}

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                  {error}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] transition-colors font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center dark:bg-slate-800">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">
              Excluir Usuário?
            </h3>
            <p className="text-slate-500 mb-6 text-sm dark:text-slate-400">
              Tem certeza? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm font-medium dark:bg-rose-600 dark:hover:bg-rose-700"
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

export default UserManager;
