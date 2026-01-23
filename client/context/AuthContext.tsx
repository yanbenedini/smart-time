import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { SystemUser } from "../types";
import { loginUser as loginService } from "../services/dbService";

interface AuthContextType {
    user: SystemUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: SystemUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<SystemUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restaurar sessão ao recarregar página
        const storedUser = localStorage.getItem("smarttime_user");
        const storedToken = localStorage.getItem("smarttime_token");

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error("Erro ao restaurar usuário:", error);
                logout(); // Limpa se estiver corrompido
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const loggedUser = await loginService(email, password);
            // O loginService já salva no localStorage, nós só atualizamos o estado
            setUser(loggedUser);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("smarttime_user");
        localStorage.removeItem("smarttime_token");
        localStorage.removeItem("smarttime_auth"); // Limpa legado se houver
        setUser(null);
    };

    const updateUser = (updatedUser: SystemUser) => {
        setUser(updatedUser);
        localStorage.setItem("smarttime_user", JSON.stringify(updatedUser)); // Atualiza persistência
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
