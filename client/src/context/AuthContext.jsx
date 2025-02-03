import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { validateToken } from '../services/api/authService';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  token: null,
  user: null,
  loading: true
};

const authReducer = (state, action) => {
  console.log('AuthReducer action:', action.type, 'Current state:', state);
  
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user,
        loading: false
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'VALIDATE_TOKEN':
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user,
        loading: false
      };
    case 'INVALIDATE_TOKEN':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider initializing');
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkTokenValidity = async () => {
      console.log('Checking token validity...');
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token);
      
      dispatch({ type: 'SET_LOADING', payload: true });

      if (!token) {
        console.log('No token found, invalidating...');
        dispatch({ type: 'INVALIDATE_TOKEN' });
        return;
      }

      try {
        console.log('Validating token with API...');
        const userData = await validateToken(token);
        console.log('Token validation response:', userData);
        
        if (userData) {
          dispatch({ 
            type: 'VALIDATE_TOKEN', 
            payload: {
              token,
              user: userData
            }
          });
        } else {
          console.log('Invalid token response');
          dispatch({ type: 'INVALIDATE_TOKEN' });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        dispatch({ type: 'INVALIDATE_TOKEN' });
      }
    };

    checkTokenValidity();
  }, []);

  console.log('Current auth state:', state);

  const contextValue = {
    state,
    dispatch,
    login: (token, user) => {
      dispatch({
        type: 'LOGIN',
        payload: { token, user }
      });
    },
    logout: () => {
      dispatch({ type: 'LOGOUT' });
    }
  };

  if (state.loading) {
    console.log('Auth state is loading...');
    return null;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};