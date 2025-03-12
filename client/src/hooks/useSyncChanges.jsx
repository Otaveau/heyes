// hooks/useSyncChanges.js
import { useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { TOAST_CONFIG } from '../constants/constants';

export const useSyncChanges = (hasLocalChanges, setHasLocalChanges) => {
  // Fonction pour synchroniser les changements locaux avec le serveur
  const syncChanges = useCallback(async () => {
    if (!hasLocalChanges) return;
    
    try {
      // Simuler un délai de réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vous pouvez implémenter ici votre logique réelle de synchronisation avec le backend
      // const response = await api.syncTasks(tasks);
      
      //toast.success('Changements synchronisés avec succès', TOAST_CONFIG);
      setHasLocalChanges(false);
    } catch (error) {
      console.error('Error syncing tasks:', error);
      toast.error('Erreur de synchronisation', TOAST_CONFIG);
    }
  }, [hasLocalChanges, setHasLocalChanges]);
  
  // Synchroniser périodiquement ou avant la navigation
  useEffect(() => {
    // Synchroniser toutes les 30 secondes si des changements existent
    const interval = setInterval(() => {
      if (hasLocalChanges) {
        syncChanges();
      }
    }, 30000);
    
    // Synchroniser avant de quitter la page
    const handleBeforeUnload = (e) => {
      if (hasLocalChanges) {
        syncChanges();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasLocalChanges, syncChanges]);

  return { syncChanges };
};