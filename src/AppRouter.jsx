import { Routes, Route, Navigate } from 'react-router-dom';
import { isClosedAccessGranted } from './pages/ClosedGatePage';
import ClosedGatePage from './pages/ClosedGatePage';
import App from './App';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/closed" replace />} />
      <Route
        path="/closed"
        element={
          isClosedAccessGranted() ? (
            <App />
          ) : (
            <ClosedGatePage onSuccess={() => {}} />
          )
        }
      />
      <Route path="*" element={<Navigate to="/closed" replace />} />
    </Routes>
  );
}
