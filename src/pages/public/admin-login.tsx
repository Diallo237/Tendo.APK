import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { LoginForm } from '@/components/shared/login-form';
import { LoginLayout } from './login-layout';
import { ForgotPasswordModal } from '@/components/modals';

/** Page de connexion des administrateurs. */
export default function AdminLoginPage() {
  return (
    <>
      <LoginLayout
        icon={<ShieldCheck className="size-5" />}
        title="Connexion administrateur"
        description="Pilotez le catalogue, les commandes, les dépôts et les comptes."
        footer={
          <div className="space-y-1.5">
            <p>
              Gérant de dépôt ?{' '}
              <Link to="/depot-manager/login" className="font-medium text-primary hover:underline">
                Connexion gérant de dépôt
              </Link>
            </p>
            <p>
              Vous êtes fournisseur ?{' '}
              <Link to="/supplier/login" className="font-medium text-primary hover:underline">
                Connexion fournisseur
              </Link>
            </p>
          </div>
        }
      >
        <LoginForm space="admin" />
      </LoginLayout>

      <ForgotPasswordModal modalId="forgot-password" />
    </>
  );
}
