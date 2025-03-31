import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import CalendarView from './components/calendar/CalendarView.jsx';
 import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
// import OwnerManagement from './components/manage/OwnerManagement.jsx';
// import TeamManagement from './components/manage/TeamManagement.jsx';
// import Navigation from './components/common/Navigation.jsx';
import Spinner from './components/common/Spinner.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
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
    <Routes>
      <Route path="/" element={<div>Page d'accueil</div>} />
      <Route path="/login" element={<PublicOnlyWrapper><Login /></PublicOnlyWrapper>} />
       <Route path="/register" element={<PublicOnlyWrapper><Register /></PublicOnlyWrapper>} />
      {/* <Route path="/calendar" element={<PrivateWrapper><CalendarView /></PrivateWrapper>} /> */}
      {/* <Route path="/owners" element={<PrivateWrapper><OwnerManagement /></PrivateWrapper>} /> */}
      {/* <Route path="/teams" element={<PrivateWrapper><TeamManagement /></PrivateWrapper>} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  //   <BrowserRouter>
  //     {state.isAuthenticated && <Navigation />}
  //     <div className="flex justify-center mx-autopx-4 pt-5 transition-colors duration-200 dark:bg-gray-900 min-h-screen">
  //       <Routes>
  //         <Route path="/" element={<RootRedirect />} />
  //         <Route path="/login" element={<PublicOnlyWrapper><Login /></PublicOnlyWrapper>} />
  //         <Route path="/register" element={<PublicOnlyWrapper><Register /></PublicOnlyWrapper>} />
  //         <Route path="/calendar" element={<PrivateWrapper><CalendarView /></PrivateWrapper>} />
  //         <Route path="/owners" element={<PrivateWrapper><OwnerManagement /></PrivateWrapper>} />
  //         <Route path="/teams" element={<PrivateWrapper><TeamManagement /></PrivateWrapper>} />
  //         <Route path="*" element={<Navigate to="/" replace />} />
  //       </Routes>
  //     </div>
  //   </BrowserRouter>
   );
};

const App = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Application en cours de déploiement</h1>
      <p>Version minimale pour tester le déploiement sur Vercel.</p>
    </div>
  );
};


// const App = () => (
//   <AuthProvider>
//     <ToastContainer
//         position="top-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//       />
//       <AppContent />
//   </AuthProvider>
// );

export default App;