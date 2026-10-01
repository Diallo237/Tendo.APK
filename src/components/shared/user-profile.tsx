import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Phone, Mail, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

interface AddressData {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

interface UserProfileProps {
  user: UserData;
  address?: AddressData;
  onUpdateProfile?: (userData: UserData) => Promise<void>;
  onUpdateAddress?: (addressData: AddressData) => Promise<void>;
  onAvatarChange?: () => void;
  showAddress?: boolean;
}

export function UserProfile({ 
  user, 
  address: initialAddress,
  onUpdateProfile,
  onUpdateAddress,
  onAvatarChange,
  showAddress = true 
}: UserProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
  });

  const [addressData, setAddressData] = useState<AddressData>(
    initialAddress || {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
    }
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (onUpdateProfile) {
        await onUpdateProfile(userData);
      } else {
        // Simuler une requête API si pas de callback fourni
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (onUpdateAddress) {
        await onUpdateAddress(addressData);
      } else {
        // Simuler une requête API si pas de callback fourni
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      toast.success('Adresse mise à jour avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'adresse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (onAvatarChange) {
      onAvatarChange();
    } else {
      toast.info('Fonctionnalité de téléchargement d\'avatar à venir');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar - Avatar et infos rapides */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="size-32">
                <AvatarImage src={userData.avatar} alt={`${userData.firstName} ${userData.lastName}`} />
                <AvatarFallback className="text-3xl">
                  {getInitials(userData.firstName, userData.lastName)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full size-10"
                onClick={handleAvatarClick}
              >
                <Camera className="size-4" />
              </Button>
            </div>
            
            <h2 className="mt-4 text-xl font-semibold">
              {userData.firstName} {userData.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">{userData.email}</p>
            
            <div className="mt-6 w-full space-y-2 text-sm">
              {userData.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span>{userData.email}</span>
                </div>
              )}
              {userData.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  <span>{userData.phone}</span>
                </div>
              )}
              {showAddress && addressData.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{addressData.city}, {addressData.country}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content - Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className={`grid h-auto w-full gap-1 ${showAddress ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="personal">
            <User className="mr-2 size-4" />
            <span className="hidden sm:inline">Informations Personnelles</span>
            <span className="sm:hidden">Informations</span>
          </TabsTrigger>
          {showAddress && (
            <TabsTrigger value="address">
              <MapPin className="mr-2 size-4" />
              Adresse
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Informations Personnelles */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={userData.firstName}
                      onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={userData.lastName}
                      onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Adresse */}
        {showAddress && (
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Adresse de Livraison</CardTitle>
                <CardDescription>
                  Gérez votre adresse de livraison par défaut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateAddress} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="street">Rue</Label>
                    <Input
                      id="street"
                      value={addressData.street}
                      onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                      placeholder="15 Rue de la Liberté"
                      required
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="region">Région</Label>
                      <Input
                        id="region"
                        value={addressData.region}
                        onChange={(e) => setAddressData({ ...addressData, region: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        value={addressData.country}
                        onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Enregistrement...' : 'Enregistrer l\'adresse'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
