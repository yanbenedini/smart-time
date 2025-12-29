import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit2, Search, X, Lock, Mail, User, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { SystemUser } from '../types';
import { getSystemUsers, saveSystemUser, deleteSystemUser } from '../services/dbService';

interface UserManagerProps {
  currentUser: SystemUser;
}

const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Carrega dados da API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getSystemUsers();
      setUsers(data);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      isAdmin: false
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (user: SystemUser) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password, // Em produção, não deveríamos expor a senha assim
      confirmPassword: user.password,
      isAdmin: user.isAdmin
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!formData.name || !formData.email || !formData.password) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (formData.password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    // Verifica duplicidade de email (apenas no front para feedback rápido)
    const duplicate = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== editingId);
    if (duplicate) {
      setError("Este email já está em uso por outro usuário.");
      return;
    }

    const newUser: SystemUser = {
      // Se novo, manda ID vazio para o backend criar UUID
      id: editingId || '', 
      name: formData.name,
      email: formData.email,
      password: formData.password,
      isAdmin: formData.isAdmin
    };

    try {
      await saveSystemUser(newUser);
      await loadData(); // Recarrega do banco
      closeModal();
    } catch (err) {
      setError("Erro ao salvar usuário. Tente novamente.");
    }
  };

  const requestDelete = (id: string) => {
    if (id === currentUser.id) {
      alert("Você não pode excluir seu próprio usuário enquanto está logado.");
      return;
    }
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      try {
        await deleteSystemUser(deleteConfirmationId);
        await loadData();
        setDeleteConfirmationId(null);
      } catch (err) {
        alert("Erro ao excluir usuário.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] flex items-center gap-2">
            <Shield className="text-[#204294]" /> 
            Usuários do Sistema
          </h1>
          <p className="text-slate-500">Gerencie quem tem acesso ao painel administrativo.</p>
        </div>
        
        <button 
          onClick={openNewModal}
          className="flex-1 md:flex-none bg-[#204294] hover:bg-[#1a367a] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-bold"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Novo Usuário</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#204294] transition-colors"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Usuário</th>
                <th className="p-4">Email</th>
                <th className="p-4">Permissão</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1E1E1E] font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-[#1E1E1E]">{user.name}</span>
                      {currentUser.id === user.id && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Você</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">{user.email}</td>
                  <td className="p-4">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#204294]/10 text-[#204294] text-xs font-bold border border-[#204294]/20">
                        <Shield size={12} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                        <User size={12} /> Usuário
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-[#204294] hover:bg-[#204294]/5 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => requestDelete(user.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.id === currentUser.id 
                            ? 'text-slate-300 cursor-not-allowed' 
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        disabled={user.id === currentUser.id}
                        title={user.id === currentUser.id ? "Você não pode se excluir" : "Excluir"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#1E1E1E]">
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#204294] focus:ring-1 focus:ring-[#204294]"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: João Silva"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#204294] focus:ring-1 focus:ring-[#204294]"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="usuario@empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#204294] focus:ring-1 focus:ring-[#204294]"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#204294] focus:ring-1 focus:ring-[#204294]"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="••••"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-[#204294] rounded focus:ring-[#204294]"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-700">Acesso Administrativo</span>
                    <span className="block text-xs text-slate-500">Pode gerenciar usuários e configurações.</span>
                  </div>
                </label>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-[#204294] text-white rounded-lg hover:bg-[#1a367a] transition-colors shadow-sm font-bold">
                  Salvar Usuário
                </button>
              </div>
            </form>
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Usuário?</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Esta ação não pode ser desfeita. O acesso deste usuário será revogado imediatamente.
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

export default UserManager;