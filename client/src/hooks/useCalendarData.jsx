import { useState, useEffect, useCallback, useRef } from 'react';
import { formatUTCDate } from '../utils/dateUtils';
import { getStatusId, formatTasksUtil } from '../utils/taskFormatters';
import { STATUS_TYPES } from '../constants/constants';
import { fetchTasks } from '../services/api/taskService';
import { fetchOwners } from '../services/api/ownerService';
import { fetchHolidays } from '../services/api/holidayService';
import { fetchStatuses } from '../services/api/statusService';


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
        console.error('Données invalides:', { tasksData, statusesData });
        return [];
    }

    const formattedTasks = tasksData.map(task => {
        // Trouver le statut correspondant
        const status = statusesData.find(s => s.status_id === task.statusId) || {};

        return {
            id: task.id,
            title: task.title || 'Sans titre',
            start: new Date(task.startDate),
            end: new Date(task.endDate),      
            resourceId: task.ownerId,
            statusId: task.statusId,
            description: task.description,
            extendedProps: {
                userId: task.userId,
                originalStatus: status.status_type
            }
        };
    });

    return formattedTasks;
}, []);


const loadData = useCallback(async () => {
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

    const formattedHolidays = formatHolidays(holidayDates);
    const formattedResources = formatResources(ownersData);
    const formattedTasks = formatTasksWithCalendar(tasksData, statusesData);

    setHolidays(formattedHolidays);
    setResources(formattedResources);
    setStatuses(statusesData);
    setTasks(formattedTasks);

  } catch (err) {
    console.error('Detailed Error in loadData:', err);
    setError(err);
  } finally {
    setIsLoading(false);
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
        if (updatedTask.statusId === STATUS_TYPES.WIP && updatedTask.resourceId) {
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