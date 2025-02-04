import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CalendarView } from './components/Calendar/CalendarView';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OwnerManagement from './components/Management/OwnerManagement';
import TeamManagement from './components/Management/TeamManagement';
import Navigation from './components/ui/navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const PrivateWrapper = ({ children }) => {
  const { state } = useAuth();
  
  if (state.loading) {
    return null; // ou un composant de chargement
  }
  
  return state.isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicOnlyWrapper = ({ children }) => {
  const { state } = useAuth();
  
  if (state.loading) {
    return null; // ou un composant de chargement
  }
  
  return state.isAuthenticated ? <Navigate to="/calendar" replace /> : children;
};

const RootRedirect = () => {
  const { state } = useAuth();
  
  if (state.loading) {
    return null; // ou un composant de chargement
  }
  
  return state.isAuthenticated ? (
    <Navigate to="/calendar" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

const AppContent = () => {
  const { state } = useAuth();

  if (state.loading) {
    return null; // ou un composant de chargement
  }

  return (
    <BrowserRouter>
      {state.isAuthenticated && <Navigation />}
      <div className="mainContainer mx-auto px-4">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<PublicOnlyWrapper><Login /></PublicOnlyWrapper>} />
          <Route path="/register" element={<PublicOnlyWrapper><Register /></PublicOnlyWrapper>} />
          <Route path="/calendar" element={<PrivateWrapper><CalendarView /></PrivateWrapper>} />
          <Route path="/owners" element={<PrivateWrapper><OwnerManagement /></PrivateWrapper>} />
          <Route path="/teams" element={<PrivateWrapper><TeamManagement /></PrivateWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <AppContent />
  </AuthProvider>
);

export default App;