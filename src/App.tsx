import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/shared/theme-provider"
import { ModalProvider } from "./components/shared/modal-provider"
import { CartProvider } from "./contexts/cart-context"
import { FavoritesProvider } from "./contexts/favorites-context"
import { Toaster } from 'sonner'
import PublicRouter from "./pages/public/public-router"
import AdminRouter from "./pages/admin/admin-router"
import SupplierRouter from "./pages/supplier/supplier-router"
import CustomerRouter from "./pages/customer/customer-router"
import DepotManagerRouter from "./pages/depot-manager/depot-router"
import { UserProvider } from "./contexts/user-context"
import AuthGuard from "./helpers/auth-guard"
import { PlatformBranding } from "./components/shared/platform-branding"
import SupplierLoginPage from "./pages/public/supplier-login"
import AdminLoginPage from "./pages/public/admin-login"
import DepotManagerLoginPage from "./pages/public/depot-login"
import OrderTrackingPage from "./pages/public/order-tracking"
import CheckoutPage from "./pages/customer/checkout"


function App() {

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      {/* Titre et icône de l'onglet alignés sur les paramètres de la plateforme */}
      <PlatformBranding />
      <ModalProvider>
        <UserProvider>
          <CartProvider>
            <FavoritesProvider>
              <Router>
                <Routes>

                  {/* Pages de connexion des espaces internes (les clients se
                      connectent depuis la boutique, via la modale).
                      Déclarées avant les routes protégées pour rester accessibles hors session. */}
                  <Route path="/supplier/login" element={<SupplierLoginPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/depot-manager/login" element={<DepotManagerLoginPage />} />

                  {/* Commander sans compte : même page de checkout, parcours identique */}
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/suivi-commande" element={<OrderTrackingPage />} />

                  {/* Routes publiques */}
                  <Route path="/*" element={<PublicRouter />}/>

                  {/* Routes client connecté */}
                  <Route path="/customer/*" element={<AuthGuard allowedRoles={['client']}><CustomerRouter /></AuthGuard>} />

                  {/* Routes admin */}
                  <Route path="/admin/*" element={<AuthGuard allowedRoles={['admin']}><AdminRouter /></AuthGuard>} />

                  {/* Routes fournisseur */}
                  <Route path="/supplier/*" element={<AuthGuard allowedRoles={['fournisseur']}><SupplierRouter /></AuthGuard>} />

                  {/* Routes gérant de dépôt */}
                  <Route path="/depot-manager/*" element={<AuthGuard allowedRoles={['gerant_depot']}><DepotManagerRouter /></AuthGuard>} />

                {/* Redirection par défaut */}
                {/* <Route path="*" element={<Navigate to="/" replace />} /> */}

                </Routes>
              </Router>
            </FavoritesProvider>
          </CartProvider>
        </UserProvider>
      </ModalProvider>
        {/* Toaster pour les notifications */}
        <Toaster 
          // position="top-right"
          richColors
          closeButton
        />
    </ThemeProvider>
  )
}

export default App
