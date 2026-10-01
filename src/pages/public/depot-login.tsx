import { Link } from 'react-router-dom';
import { PackageCheck } from 'lucide-react';

import { LoginForm } from '@/components/shared/login-form';
import { CLIENT_LOGIN_PATH } from '@/helpers/login-paths';
import { LoginLayout } from './login-layout';
import { ForgotPasswordModal } from '@/components/modals';

/** Page de connexion des gérants de dépôt. */
export default function DepotManagerLoginPage() {
  return (
    <>
      <LoginLayout
        icon={<PackageCheck className="size-5" />}
        title="Connexion gérant de dépôt"
        description="Réceptionnez les colis, prévenez les clients et gérez les retraits."
        footer={
          <p>
            Vous êtes client ?{' '}
            <Link to={CLIENT_LOGIN_PATH} className="font-medium text-primary hover:underline">
              Connexion client
            </Link>
          </p>
        }
      >
        <LoginForm space="gerant_depot" />
      </LoginLayout>

      <ForgotPasswordModal modalId="forgot-password" />
    </>
  );
}
