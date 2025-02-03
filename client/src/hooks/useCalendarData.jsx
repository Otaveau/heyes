import { useState, useEffect, useCallback } from 'react';
import { formatUTCDate } from '../utils/dateUtils';
import { getStatusId, formatTasksUtil } from '../utils/taskFormatters';
import { STATUS_TYPES } from '../constants/constants';
import { fetchHolidays, fetchOwners, fetchTasks, fetchStatuses } from '../services/apiService';

export const useCalendarData = () => {
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formatage des jours fériés
  const formatHolidays = useCallback((holidayDates) => {
    if (!holidayDates || typeof holidayDates !== 'object') {
      return [];
    }

    return Object.keys(holidayDates).map(formatUTCDate);
  }, []);

  // Formatage des ressources
  const formatResources = useCallback((ownersData) => {
    if (!Array.isArray(ownersData)) {
      return [];
    }
    console.log('formatResources ownersData :', ownersData);
    return ownersData.map(owner => ({
      id: owner.ownerId,
      title: owner.name || 'Sans nom'
    }));
  }, []);

  const formatTasksWithCalendar = useCallback((tasksData, statusesData) => {
    const formattedTasks = [];
    
    // D'abord, formater toutes les tâches avec l'utilitaire existant
    const basicFormattedTasks = formatTasksUtil(tasksData, statusesData);
    
    // Ensuite, dupliquer les tâches WIP avec owner pour le calendrier
    basicFormattedTasks.forEach(task => {
      formattedTasks.push(task); // Ajouter la version backlog
      
      // Si la tâche est en WIP et a un owner, ajouter la version calendrier
      if (task.statusId === 2 && task.resourceId) {
        formattedTasks.push({
          ...task,
          source: 'calendar',
          isCalendarTask: true // Marquer comme tâche de calendrier
        });
      }
    });
    
    return formattedTasks;
  }, []);



  // Fonction principale de chargement des données
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [holidayDates, ownersData, tasksData, statusesData] = await Promise.all([
        fetchHolidays(new Date().getFullYear()),
        fetchOwners(),
        fetchTasks(),
        fetchStatuses()
      ]);

      setHolidays(formatHolidays(holidayDates));
      setResources(formatResources(ownersData));
      setStatuses(statusesData);

      // Utiliser la nouvelle fonction de formatage
      const formattedTasks = formatTasksWithCalendar(tasksData, statusesData);
      setTasks(formattedTasks);
      console.log('Tâches formatées avec calendrier:', formattedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(new Error(errorMessage));
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setIsLoading(false);
    }
  }, [formatHolidays, formatResources, formatTasksWithCalendar]);


  // Effet initial pour charger les données
  useEffect(() => {
    loadData();
  }, [loadData]);

   // Mettre à jour la fonction updateTask pour gérer les tâches dupliquées
   const updateTask = useCallback(async (taskId, updates) => {
    try {
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.filter(task => task.id !== taskId);
        const taskToUpdate = currentTasks.find(task => task.id === taskId);
        
        if (!taskToUpdate) return currentTasks;
        
        const updatedTask = { ...taskToUpdate, ...updates };
        updatedTasks.push(updatedTask);
        
        // Si la tâche mise à jour est en WIP et a un owner, ajouter/mettre à jour la version calendrier
        if (updatedTask.statusId === 2 && updatedTask.resourceId) {
          updatedTasks.push({
            ...updatedTask,
            source: 'calendar',
            isCalendarTask: true
          });
        }
        
        return updatedTasks;
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la tâche:', err);
      throw err;
    }
  }, []);

  // Mettre à jour la fonction addTask pour gérer les tâches dupliquées
  const addTask = useCallback((newTask) => {
    setTasks(currentTasks => {
      const taskToAdd = {
        ...newTask,
        statusId: getStatusId(statuses, STATUS_TYPES.ENTRANT)
      };
      
      const updatedTasks = [...currentTasks, taskToAdd];
      
      // Si la nouvelle tâche est en WIP et a un owner, ajouter la version calendrier
      if (taskToAdd.statusId === 2 && taskToAdd.resourceId) {
        updatedTasks.push({
          ...taskToAdd,
          source: 'calendar',
          isCalendarTask: true
        });
      }
      
      return updatedTasks;
    });
  }, [statuses]);

  return {
    tasks,
    resources,
    holidays,
    statuses,
    isLoading,
    error,
    refreshData: loadData,
    updateTask,
    addTask,
    setTasks
  };
};