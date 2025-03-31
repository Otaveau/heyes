import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CalendarView } from './components/calendar/CalendarView';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import OwnerManagement from './components/manage/OwnerManagement';
import TeamManagement from './components/manage/TeamManagement';
import Navigation from './components/ui/navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/ui/spinner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateWrapper = ({ children }) => {
  const { state } = useAuth();
  return state.loading ? <Spinner /> : (state.isAuthenticated ? children : <Navigate to="/login" replace />);
};

const PublicOnlyWrapper = ({ children }) => {
  const { state } = useAuth();
  return state.loading ? <Spinner /> : (state.isAuthenticated ? <Navigate to="/calendar" replace /> : children);
};


const RootRedirect = () => {
  const { state } = useAuth();
  return state.loading ? <Spinner /> : (
    state.isAuthenticated ? <Navigate to="/calendar" replace /> : <Navigate to="/login" replace />
  );
};

const AppContent = () => {
  const { state } = useAuth();

  if (state.loading) {
    return <Spinner />;
  }

  return (
    <BrowserRouter>
      {state.isAuthenticated && <Navigation />}
      <div className="flex justify-center mx-autopx-4 pt-5 transition-colors duration-200 dark:bg-gray-900 min-h-screen">
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