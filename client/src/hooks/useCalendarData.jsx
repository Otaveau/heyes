import { useState, useEffect, useCallback, useRef } from 'react';
import { formatUTCDate } from '../utils/dateUtils';
import { getStatusId } from '../utils/taskFormatters';
import { STATUS_TYPES } from '../constants/constants';
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
      return Object.keys(holidayDates).map(formatUTCDate);
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
      return {
        id: task.id,
        title: task.title || 'Sans titre',
        start: task.startDate,
        end: task.endDate,
        resourceId: task.ownerId,
        statusId: task.statusId,
        description: task.description,
        extendedProps: {
          userId: task.userId,
        },
      };
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

      setHolidays(formatHolidays(holidayDates));
      setResources(formatResources(ownersData));
      setStatuses(statusesData);
      setTasks(formatTasksForCalendar(tasksData, statusesData));
    } catch (err) {
      console.error('Detailed Error in loadData:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [formatHolidays, formatResources, formatTasksForCalendar]);


  const updateTask = useCallback(async (taskId, updates) => {

    console.log('useCalendarData updateTask  updates:', updates); 

    const previousTasks = tasks;

    setTasks(currentTasks => {
      const updatedTasks = currentTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates }
          : task
      );

      if (updates.statusId === STATUS_TYPES.WIP && updates.resourceId) {
        updatedTasks.push({
          ...updatedTasks.find(t => t.id === taskId),
          source: 'calendar',
          isCalendarTask: true,
        });
      }

      return updatedTasks;
    });

    try {
      // Appel API
      const updatedTask = await updateTaskService(taskId, updates);
      
      // Mise à jour avec les données du serveur
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      );

      return updatedTask;
    } catch (error) {
      // Rollback en cas d'erreur
      setTasks(previousTasks);
      throw error;
    }
  }, [tasks]);

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