import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.jsx'
import AdminPage, { isAdminRoute } from './pages/AdminPage.jsx'

const root = createRoot(document.getElementById('root'));

if (isAdminRoute()) {
  root.render(
    <StrictMode>
      <AdminPage />
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
}
