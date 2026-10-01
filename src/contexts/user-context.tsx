import { AuthService } from "@/services/auth.service";
import type { Users } from "@/types/user";
import apiClient, { buildApiUrl } from "@/utils/api-client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type UserContextType = {
  user: Users | null;
  setUser: React.Dispatch<React.SetStateAction<Users | null>>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

type UserProviderProps = {
  children: ReactNode;
};

// const UserProvider = (props: UserProviderProps) => {
//   const children = props.children;
//   return <div>{children}</div>;
// };

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<Users | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un token existe au démarrage
    const loadUser = async () => {
      const token = AuthService.getAuthToken();
      
      if (token) {
        try {
          const url = buildApiUrl('/auth/users/me/');
          const response = await apiClient.get(url);
          setUser(response.data as unknown as Users);
        } catch (error) {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
          // Si l'API échoue, supprimer le token invalide
          AuthService.removeAuthToken();
        }
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Ouverture de Tendo...</p>
        </div>
      </main>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("Le hook useUser doit être utilisé à l’intérieur d’un UserProvider");
  return context;
};
