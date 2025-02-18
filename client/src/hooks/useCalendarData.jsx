import { useState, useEffect, useCallback, useRef } from 'react';
import { DateUtils } from '../utils/dateUtils';
import { fetchTasks } from '../services/api/taskService';
import { fetchOwners } from '../services/api/ownerService';
import { fetchHolidays } from '../services/api/holidayService';
import { fetchStatuses } from '../services/api/statusService';
import { ERROR_MESSAGES } from '../constants/constants';
import { updateTask as updateTaskService } from '../services/api/taskService';

export const useCalendarData = () => {
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatHolidays = useCallback((holidayDates) => {
    if (!holidayDates || typeof holidayDates !== 'object') {
      console.warn(ERROR_MESSAGES.INVALID_HOLIDAY_FORMAT);
      return [];
    }

    try {
      return Object.keys(holidayDates).map(DateUtils.formatUTCDate);
    } catch (error) {
      console.error('Error formatting holidays:', error);
      return [];
    }
  }, []);

  const formatResources = useCallback((ownersData) => {
    if (!Array.isArray(ownersData)) {
      console.warn(ERROR_MESSAGES.INVALID_OWNERS_FORMAT);
      return [];
    }

    return ownersData.map(owner => ({
      id: owner.ownerId,
      title: owner.name || 'Sans nom',
      email: owner.email,
      department: owner.department,
      isActive: owner.isActive !== false,
    }));
  }, []);

  const formatTasksForCalendar = useCallback((tasksData) => {

    console.log('formatTasksForCalendar tasksData :', tasksData);

    return tasksData.map(task => {
      const formattedTask = {
        id: task.id,
        title: task.title || 'Sans titre',
        start: task.startDate,
        end: task.endDate,
        resourceId: task.ownerId || null, // Explicitement null si pas d'ownerId
        statusId: task.statusId || '1', // Statut par défaut si non défini
        description: task.description,
        extendedProps: {
          userId: task.userId,
          originalTask: task, // Garder les données originales
        }
      };
      return formattedTask;
    });
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
        fetchStatuses(),
      ]);

      console.log('Données récupérées:', {
        tasks: tasksData.length,
        owners: ownersData.length,
        statuses: statusesData.length
      });


      setHolidays(formatHolidays(holidayDates));
      setResources(formatResources(ownersData));
      setStatuses(statusesData);
      const formattedTasks = formatTasksForCalendar(tasksData, statusesData);
      console.log('Tâches formatées finales:', {
        total: formattedTasks.length,
        withoutResource: formattedTasks.filter(t => !t.resourceId).length
      });

      setTasks(formattedTasks);
    } catch (err) {
      console.error('Detailed Error in loadData:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [formatHolidays, formatResources, formatTasksForCalendar]);


  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const updatedTask = await updateTaskService(taskId, updates);
      
      setTasks(currentTasks => {
        const newTasks = currentTasks.filter(task => task.id !== taskId);
        
        const formattedTask = {
          id: updatedTask.id,
          title: updatedTask.title || 'Sans titre',
          start: updates.start,
          end: updates.end,
          resourceId: updates.resourceId || null,
          statusId: updates.statusId || '1',
          description: updatedTask.description,
          extendedProps: {
            userId: updatedTask.userId,
            originalTask: updatedTask
          }
        };

        return [...newTasks, formattedTask];
      });

      return updatedTask;
    } catch (error) {
      throw error;
    }
  }, []);

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
    setTasks,
  };
};