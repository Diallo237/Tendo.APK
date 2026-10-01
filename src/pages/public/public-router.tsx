import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layout';
import { ShopPage } from './shop';
import { ProductDetail } from './product-detail';
import { AuthCallback } from './auth-callback';
import { AccountActivation } from './account-activation';
import { ResetPassword } from './reset-password';
import PublicFavoritesPage from './favorites';



export default function PublicRouter() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route index element={<ShopPage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="shop/product/:slug" element={<ProductDetail />} />
                <Route path="favorites" element={<PublicFavoritesPage />} />
            </Route>
            {/* Route de callback OAuth (sans layout) */}
            <Route path="auth/callback" element={<AuthCallback />} />
            {/* Route d'activation de compte (sans layout) */}
            <Route path="auth/activate/:uid/:token" element={<AccountActivation />} />
            {/* Route de réinitialisation du mot de passe (sans layout) */}
            <Route path="auth/reset-password/:uid/:token" element={<ResetPassword />} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}