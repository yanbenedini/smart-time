import React, { useState } from "react";
import { Lock, X, Check, AlertCircle } from "lucide-react";
import { SystemUser } from "../types";
import { changePassword } from "../services/dbService";

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: SystemUser;
    onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    onSuccess,
}) => {
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordFeedback, setPasswordFeedback] = useState<{
        type: "error" | "success";
        message: string;
    } | null>(null);

    if (!isOpen) return null;

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

        try {
            if (!currentUser?.id) return;

            // 2. Chama a rota segura que valida o Hash no servidor
            await changePassword(
                currentUser.id,
                passwordForm.currentPassword,
                passwordForm.newPassword,
            );

            setPasswordFeedback({
                type: "success",
                message: "Senha alterada com sucesso!",
            });

            setTimeout(() => {
                onSuccess();
                setPasswordFeedback(null);
                // Opcional: Limpar o form
                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            }, 1500);
        } catch (err: any) {
            setPasswordFeedback({
                type: "error",
                message:
                    err.message || "Erro ao alterar a senha. Verifique a senha atual.",
            });
        }
    };

    return (
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
                            onClick={onClose}
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
                            className={`p-3 rounded-lg text-sm flex items-start gap-2 ${passwordFeedback.type === "error"
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
                                onClick={onClose}
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
    );
};

export default PasswordModal;
