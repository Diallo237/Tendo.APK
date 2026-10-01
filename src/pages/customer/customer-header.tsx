import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { CartModal } from '@/components/shared/cart-modal';
import { useUser } from '@/contexts/user-context';
import { UserAvatarHeader } from '@/components/shared/user-avatar';
import { usePlatformSettings } from '@/services/user.service';

export function CustomerHeader() {
  const { user } = useUser();
  const { data: platform } = usePlatformSettings();
  const siteName = platform?.name ?? 'Tendo';
  const siteLogo = platform?.logo ?? null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/customer" className="flex items-center gap-2">
              <img
                src={siteLogo || '/tendo-logo.svg'}
                alt={siteName}
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-xl hidden sm:inline-block">{siteName}</span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2">

              {/* Toggle theme */}
              <ThemeToggle />

              {/* Panier */}
              <CartModal />

              {/* Avatar avec dropdown */}
              <UserAvatarHeader user={user} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
