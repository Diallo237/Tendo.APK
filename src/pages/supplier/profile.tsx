import PageContainer from "@/components/shared/page-container";
import { UserProfile } from "@/components/shared/user-profile";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/user-context";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SupplierProfile() {
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

    // Adresse du fournisseur (pour la livraison/expédition)
    const addressData = {
        street: '25 Avenue du Commerce',
        city: 'Dakar',
        region: 'Dakar',
        postalCode: '10000',
        country: 'Sénégal',
    };

    const handleUpdateProfile = async (updatedUserData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        avatar?: string;
    }) => {
        // TODO: Appeler l'API pour mettre à jour le profil fournisseur
        console.log('Mise à jour du profil fournisseur:', updatedUserData);
        await new Promise(resolve => setTimeout(resolve, 1000));
    };

    const handleUpdateAddress = async (updatedAddressData: {
        street: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
    }) => {
        // TODO: Appeler l'API pour mettre à jour l'adresse du fournisseur
        console.log('Mise à jour de l\'adresse fournisseur:', updatedAddressData);
        await new Promise(resolve => setTimeout(resolve, 1000));
    };

    const handleAvatarChange = () => {
        // TODO: Ouvrir un dialogue pour télécharger une nouvelle photo
        console.log('Changement d\'avatar fournisseur');
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                <PageContainer 
                    title="Mon Profil" 
                    subtitle="Gérez votre profil et vos informations de fournisseur"
                >
                {/* Bouton Retour */}
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/supplier')}
                    className="mb-4"
                    >
                    <ArrowLeft className="mr-2 size-4" />
                    Retour à l'accueil
                </Button>
                    <UserProfile
                        user={userData}
                        address={addressData}
                        onUpdateProfile={handleUpdateProfile}
                        onUpdateAddress={handleUpdateAddress}
                        onAvatarChange={handleAvatarChange}
                        showAddress={true}  // Les fournisseurs ont besoin de l'adresse pour l'expédition
                    />
                </PageContainer>
            </main>
        </div>
    );
}
