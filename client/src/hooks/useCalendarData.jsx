import { useState, useEffect, useCallback, useRef } from 'react';
import { formatUTCDate } from '../utils/dateUtils';
import { getStatusId } from '../utils/taskFormatters';
import { STATUS_TYPES } from '../constants/constants';
import { fetchTasks } from '../services/api/taskService';
import { fetchOwners } from '../services/api/ownerService';
import { fetchHolidays } from '../services/api/holidayService';
import { fetchStatuses } from '../services/api/statusService';
import { ERROR_MESSAGES } from '../constants/constants';

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

  const formatTasksWithCalendar = useCallback((tasksData, statusesData) => {
    if (!Array.isArray(tasksData) || !Array.isArray(statusesData)) {
      console.error('Invalid data:', { tasksData, statusesData });
      return [];
    }

    return tasksData.map(task => {
      const status = statusesData.find(s => s.status_id === task.statusId) || {};
      return {
        id: task.id,
        title: task.title || 'Sans titre',
        start: formatUTCDate(task.startDate),
        end: formatUTCDate(task.endDate),
        resourceId: task.ownerId,
        statusId: task.statusId,
        description: task.description,
        extendedProps: {
          userId: task.userId,
          originalStatus: status.status_type,
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
      setTasks(formatTasksWithCalendar(tasksData, statusesData));
    } catch (err) {
      console.error('Detailed Error in loadData:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [formatHolidays, formatResources, formatTasksWithCalendar]);

  const updateTask = useCallback(async (taskId, updates) => {
    if (!taskId) {
      throw new Error(ERROR_MESSAGES.TASK_ID_REQUIRED);
    }

    setTasks(currentTasks => {
      const taskToUpdate = currentTasks.find(task => task.id === taskId);
      if (!taskToUpdate) {
        console.warn(ERROR_MESSAGES.TASK_NOT_FOUND.replace('{id}', taskId));
        return currentTasks;
      }

      const updatedTask = {
        ...taskToUpdate,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      const updatedTasks = currentTasks.filter(task => task.id !== taskId);
      updatedTasks.push(updatedTask);

      if (updatedTask.statusId === STATUS_TYPES.WIP && updatedTask.resourceId) {
        updatedTasks.push({
          ...updatedTask,
          source: 'calendar',
          isCalendarTask: true,
        });
      }

      return updatedTasks;
    });
  }, []);

  const addTask = useCallback((newTask) => {
    if (!newTask) {
      throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    }

    setTasks(currentTasks => {
      const taskToAdd = {
        ...newTask,
        id: newTask.id || `task-${Date.now()}`,
        statusId: getStatusId(statuses, STATUS_TYPES.ENTRANT),
        createdAt: new Date().toISOString(),
      };

      const updatedTasks = [...currentTasks, taskToAdd];

      if (taskToAdd.statusId === STATUS_TYPES.WIP && taskToAdd.resourceId) {
        updatedTasks.push({
          ...taskToAdd,
          source: 'calendar',
          isCalendarTask: true,
        });
      }

      return updatedTasks;
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
    setTasks,
  };
};