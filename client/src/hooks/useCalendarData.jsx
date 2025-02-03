import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Utiliser useRef pour suivre si le composant est monté
  const isMounted = useRef(true);

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatHolidays = useCallback((holidayDates) => {
    if (!holidayDates || typeof holidayDates !== 'object') {
      console.warn('Invalid holiday dates format received');
      return [];
    }

    try {
      return Object.keys(holidayDates).map(formatUTCDate);
    } catch (error) {
      console.error('Error formatting holidays:', error);
      return [];
    }
  }, []);

  const formatResources = useCallback((ownersData) => {
    if (!Array.isArray(ownersData)) {
      console.warn('Invalid owners data format received');
      return [];
    }

    return ownersData.map(owner => ({
      id: owner.ownerId,
      title: owner.name || 'Sans nom',
      email: owner.email,
      department: owner.department,
      isActive: owner.isActive !== false
    }));
  }, []);

  const formatTasksWithCalendar = useCallback((tasksData, statusesData) => {
    if (!Array.isArray(tasksData) || !Array.isArray(statusesData)) {
      console.warn('Invalid tasks or statuses data format');
      return [];
    }

    try {
      const formattedTasks = [];
      const basicFormattedTasks = formatTasksUtil(tasksData, statusesData);
      
      basicFormattedTasks.forEach(task => {
        // Valider les dates de la tâche
        const startDate = new Date(task.start || task.startDate);
        const endDate = new Date(task.end || task.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn(`Invalid dates for task ${task.id}`);
          return;
        }

        // Ajouter la version backlog
        formattedTasks.push({
          ...task,
          source: 'backlog',
          start: startDate,
          end: endDate,
        });
        
        // Ajouter la version calendrier si nécessaire
        if (task.statusId === STATUS_TYPES.WIP && task.resourceId) {
          formattedTasks.push({
            ...task,
            source: 'calendar',
            isCalendarTask: true,
            start: startDate,
            end: endDate,
          });
        }
      });
      
      return formattedTasks;
    } catch (error) {
      console.error('Error formatting tasks:', error);
      return [];
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const year = new Date().getFullYear();
      
      const [holidayDates, ownersData, tasksData, statusesData] = await Promise.all([
        fetchHolidays(year),
        fetchOwners(),
        fetchTasks(),
        fetchStatuses()
      ]);

      if (!isMounted.current) return;

      const formattedHolidays = formatHolidays(holidayDates);
      const formattedResources = formatResources(ownersData);
      const formattedTasks = formatTasksWithCalendar(tasksData, statusesData);

      setHolidays(formattedHolidays);
      setResources(formattedResources);
      setStatuses(statusesData);
      setTasks(formattedTasks);

    } catch (err) {
      if (!isMounted.current) return;
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Une erreur est survenue lors du chargement des données';
      
      setError(new Error(errorMessage));
      console.error('Error loading data:', err);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [formatHolidays, formatResources, formatTasksWithCalendar]);

  const updateTask = useCallback(async (taskId, updates) => {
    if (!taskId) {
      throw new Error('Task ID is required for update');
    }

    try {
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.filter(task => task.id !== taskId);
        const taskToUpdate = currentTasks.find(task => task.id === taskId);
        
        if (!taskToUpdate) {
          console.warn(`Task with id ${taskId} not found`);
          return currentTasks;
        }
        
        const updatedTask = { 
          ...taskToUpdate, 
          ...updates,
          lastUpdated: new Date().toISOString()
        };

        // Ajouter la version backlog
        updatedTasks.push(updatedTask);
        
        // Gérer la version calendrier
        if (updatedTask.statusId ===  STATUS_TYPES.WIP && updatedTask.resourceId) {
          updatedTasks.push({
            ...updatedTask,
            source: 'calendar',
            isCalendarTask: true
          });
        }
        
        return updatedTasks;
      });
    } catch (err) {
      console.error('Error updating task:', err);
      throw new Error('Erreur lors de la mise à jour de la tâche');
    }
  }, []);

  const addTask = useCallback((newTask) => {
    if (!newTask) {
      throw new Error('Task data is required');
    }

    setTasks(currentTasks => {
      try {
        const taskToAdd = {
          ...newTask,
          id: newTask.id || `task-${Date.now()}`,
          statusId: getStatusId(statuses, STATUS_TYPES.ENTRANT),
          createdAt: new Date().toISOString()
        };
        
        const updatedTasks = [...currentTasks, taskToAdd];
        
        if (taskToAdd.statusId === STATUS_TYPES.WIP && taskToAdd.resourceId) {
          updatedTasks.push({
            ...taskToAdd,
            source: 'calendar',
            isCalendarTask: true
          });
        }
        
        return updatedTasks;
      } catch (error) {
        console.error('Error adding task:', error);
        return currentTasks;
      }
    });
  }, [statuses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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