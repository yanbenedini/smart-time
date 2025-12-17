
import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, Edit2, Shield, Mail, Key, X, Check, Eye, EyeOff } from 'lucide-react';
import { SystemUser } from '../types';
import { getSystemUsers, saveSystemUser, deleteSystemUser } from '../services/dbService';

interface UserManagerProps {
  currentUser: SystemUser;
}

const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = currentUser.id === 'admin-1';

  useEffect(() => {
    setUsers(getSystemUsers());
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('123Mudar');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    const duplicate = users.find(u => u.email === email && u.id !== editingId);
    if (duplicate) {
      setError("Este email já está cadastrado.");
      return;
    }

    const newUser: SystemUser = {
      id: editingId || Date.now().toString(),
      name,
      email,
      password,
      isAdmin: isSuperAdmin ? isAdmin : (editingId ? (users.find(u => u.id === editingId)?.isAdmin || false) : false),
      mustChangePassword: editingId ? users.find(u => u.id === editingId)?.mustChangePassword : true
    };

    saveSystemUser(newUser, currentUser.name);
    setUsers(getSystemUsers());
    closeModal();
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      deleteSystemUser(deleteConfirmationId, currentUser.name);
      setUsers(getSystemUsers());
      setDeleteConfirmationId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (user.id === currentUser.id) return false;
    if (isSuperAdmin) return true;
    if (user.isAdmin) return false;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E]">Usuários do Sistema</h1>
          <p className="text-slate-500">Gerencie quem tem acesso ao Smart Time.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-[#204294] hover:bg-[#1a367a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-bold"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Novo Usuário</span>
        </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Contas Cadastradas</h3>
            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                Visualizando: {filteredUsers.length}
            </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div 
                key={user.id} 
                onClick={() => handleEdit(user)}
                className="p-4 hover:bg-[#204294]/5 transition-colors duration-200 cursor-pointer group hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user.isAdmin ? 'bg-[#204294]/10 text-[#204294]' : 'bg-slate-100 text-slate-500'}`}>
                          {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <div className="font-bold text-[#1E1E1E] flex items-center gap-2">
                              {user.name}
                              {user.isAdmin && <Shield size={14} className="text-[#204294]" />}
                          </div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      {user.id !== 'admin-1' && (
                        <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(user.id);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">Nenhum outro usuário encontrado.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center gap-2">
                    {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                    {editingId ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <div className="relative">
                        <UserCog size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        <input required type="text" className="w-full border border-slate-300 rounded-lg pl-10 p-2 outline-none focus:border-[#204294]" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        <input required type="email" className="w-full border border-slate-300 rounded-lg pl-10 p-2 outline-none focus:border-[#204294]" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                    <div className="relative">
                        <Key size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        <input required type={showPassword ? "text" : "password"} className="w-full border border-slate-300 rounded-lg pl-10 pr-10 p-2 outline-none focus:border-[#204294]" value={password} onChange={e => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="isAdmin" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="w-4 h-4 text-[#204294] rounded focus:ring-[#204294]" />
                        <label htmlFor="isAdmin" className="text-sm text-slate-700">Este usuário é Administrador?</label>
                    </div>
                )}

                {error && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">{error}</div>}

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] transition-colors font-bold shadow-sm">Salvar</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
