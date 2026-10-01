import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '@/components/shared/page-container';
import { UserProfile } from '@/components/shared/user-profile';
import { useUser } from '@/contexts/user-context';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useUser(); 
  
  // Données utilisateur du contexte
  const userData = {
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.profile?.avatar || '',
  };

  // Adresse par défaut (à remplacer par les vraies données de l'API plus tard)
  const addressData = {
    street: '15 Rue de la Liberté',
    city: 'Dakar',
    region: 'Dakar',
    postalCode: '12000',
    country: 'Sénégal',
  };

  // Callbacks pour les mises à jour (à connecter à l'API plus tard)
  const handleUpdateProfile = async (updatedUserData: { 
    firstName: string; 
    lastName: string; 
    email?: string; 
    phone?: string; 
    avatar?: string;
  }) => {
    // TODO: Appeler l'API pour mettre à jour le profil
    console.log('Mise à jour du profil:', updatedUserData);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler l'API
  };

  const handleUpdateAddress = async (updatedAddressData: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  }) => {
    // TODO: Appeler l'API pour mettre à jour l'adresse
    console.log('Mise à jour de l\'adresse:', updatedAddressData);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler l'API
  };

  const handleAvatarChange = () => {
    // TODO: Ouvrir un dialogue pour télécharger une nouvelle photo
    console.log('Changement d\'avatar');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Bouton Retour */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/customer')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Retour à l'accueil
        </Button>

        <PageContainer 
          title="Mon Profil" 
          subtitle="Gérez vos informations personnelles et votre adresse"
        >
          <UserProfile
            user={userData}
            address={addressData}
            onUpdateProfile={handleUpdateProfile}
            onUpdateAddress={handleUpdateAddress}
            onAvatarChange={handleAvatarChange}
            showAddress={true}
          />
        </PageContainer>
      </main>
    </div>
  );
}
