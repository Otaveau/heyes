import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/hays.png';
import { 
  Calendar, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,  
  Settings
} from 'lucide-react';

export default function Navigation () {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { state, logout } = useAuth();
  const location = useLocation();

  // Fermer les menus quand on change de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { path: '/calendar', icon: <Calendar className="h-6 w-6" />, label: 'Calendrier' },
    { path: '/owners', icon: <UserCircle className="h-6 w-6" />, label: 'Membres' },
    { path: '/teams', icon: <Users className="h-6 w-6" />, label: 'Équipes' },
  ];

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* Barre principale avec fond subtilement coloré */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo et navigation principale */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/calendar" className="flex items-center">
                  <img src={logoImage} alt="Heyes" className="h-10 w-auto" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white ml-1">Eyes</span>
                </Link>
              </div>

              {/* Navigation desktop */}
              <div className="hidden sm:ml-10 sm:flex sm:space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-150 ${
                      location.pathname === item.path
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2 text-lg">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions de droite */}
            <div className="flex items-center">

              {/* Menu utilisateur */}
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    id="user-menu"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Ouvrir le menu utilisateur</span>
                    <div className="h-10 w-10 rounded-full bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center text-white text-lg">
                      {state.user && state.user.name ? state.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>
                </div>
                {/* Menu déroulant */}
                {isUserMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="py-1">
                      <div className="block px-4 py-2 text-base text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{state.user?.name || 'Utilisateur'}</div>
                        <div className="text-gray-500 dark:text-gray-400 truncate">{state.user?.email || ''}</div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {/* TODO: navigation vers les paramètres */}}
                        className="w-full text-left block px-4 py-2 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <Settings className="h-5 w-5 mr-2" />
                          Paramètres
                        </div>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-base text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <LogOut className="h-5 w-5 mr-2" />
                          Déconnexion
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton menu mobile */}
              <div className="flex items-center sm:hidden ml-3">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  aria-expanded="false"
                >
                  <span className="sr-only">Ouvrir le menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } sm:hidden bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm`}
      >
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-lg font-medium ${
                location.pathname === item.path
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center text-white text-xl">
                {state.user && state.user.name ? state.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="ml-3">
              <div className="text-lg font-medium text-gray-800 dark:text-white">
                {state.user?.name || 'Utilisateur'}
              </div>
              <div className="text-base font-medium text-gray-500 dark:text-gray-400">
                {state.user?.email || ''}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={() => {/* TODO: navigation vers les paramètres */}}
              className="w-full flex items-center px-4 py-3 text-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="h-6 w-6 mr-3 text-gray-500 dark:text-gray-400" />
              Paramètres
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-lg font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="h-6 w-6 mr-3 text-red-500 dark:text-red-400" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};