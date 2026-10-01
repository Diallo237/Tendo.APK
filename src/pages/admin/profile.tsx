import PageContainer from "@/components/shared/page-container";
import { UserProfile } from "@/components/shared/user-profile";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/user-context";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminProfile() {
    const { user } = useUser();
     const navigate = useNavigate();

    // Données utilisateur depuis le contexte
    const userData = {
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        avatar: user?.profile?.avatar || '',
    };

    const handleUpdateProfile = async (updatedUserData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        avatar?: string;
    }) => {
        // TODO: Appeler l'API pour mettre à jour le profil admin
        console.log('Mise à jour du profil admin:', updatedUserData);
        await new Promise(resolve => setTimeout(resolve, 1000));
    };

    const handleAvatarChange = () => {
        // TODO: Ouvrir un dialogue pour télécharger une nouvelle photo
        console.log('Changement d\'avatar admin');
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                <PageContainer 
                    title="Mon Profil" 
                    subtitle="Gérez vos informations personnelles"
                >
                {/* Bouton Retour */}
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/admin')}
                    className="mb-4"
                    >
                    <ArrowLeft className="mr-2 size-4" />
                    Retour à l'accueil
                </Button>
                    <UserProfile
                        user={userData}
                        onUpdateProfile={handleUpdateProfile}
                        onAvatarChange={handleAvatarChange}
                        showAddress={false}  // Pas d'adresse pour les admins
                    />
                </PageContainer>
            </main>
        </div>
    );
}
