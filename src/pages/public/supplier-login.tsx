import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

import { LoginForm } from '@/components/shared/login-form';
import { CLIENT_LOGIN_PATH } from '@/helpers/login-paths';
import { LoginLayout } from './login-layout';
import { ForgotPasswordModal } from '@/components/modals';

/** Page de connexion des fournisseurs. */
export default function SupplierLoginPage() {
  return (
    <>
      <LoginLayout
        icon={<Store className="size-5" />}
        title="Connexion fournisseur"
        description="Gérez votre catalogue, vos commandes et vos expéditions."
        footer={
          <div className="space-y-1.5">
            <p>
              Vous n'avez pas encore d'accès fournisseur ? Connectez-vous à votre{' '}
              <Link to={CLIENT_LOGIN_PATH} className="font-medium text-primary hover:underline">
                espace client
              </Link>{' '}
              et demandez-le depuis votre profil : un administrateur l'examinera.
            </p>
          </div>
        }
      >
        <LoginForm space="fournisseur" />
      </LoginLayout>

      <ForgotPasswordModal modalId="forgot-password" />
    </>
  );
}
