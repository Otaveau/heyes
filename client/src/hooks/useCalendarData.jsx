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

      // Traitement et mise à jour des données
      setHolidays(formatHolidays(holidayDates));
      setResources(formatResources(ownersData));
      setStatuses(statusesData);

      // Utilisation de la fonction utilitaire pour formater les tâches
      const formattedTasks = formatTasksUtil(tasksData, statusesData);
      setTasks(formattedTasks);
      console.log('fetchTasks :', formattedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(new Error(errorMessage));
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setIsLoading(false);
    }
  }, [formatHolidays, formatResources]);


  // Effet initial pour charger les données
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fonction pour mettre à jour une tâche
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updates }
            : task
        )
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la tâche:', err);
      throw err;
    }
  }, []);

  // Fonction pour ajouter une tâche
  const addTask = useCallback((newTask) => {
    setTasks(currentTasks => [...currentTasks, {
      ...newTask,
      statusId: getStatusId(statuses, STATUS_TYPES.ENTRANT)
    }]);
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