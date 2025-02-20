import { useState, useEffect, useCallback, useRef } from 'react';
import { DateUtils } from '../utils/dateUtils';
import { fetchTasks } from '../services/api/taskService';
import { fetchOwners } from '../services/api/ownerService';
import { fetchHolidays } from '../services/api/holidayService';
import { fetchStatuses } from '../services/api/statusService';
import { ERROR_MESSAGES } from '../constants/constants';
import { toast } from 'react-toastify';


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
      return Object.keys(holidayDates).map();
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
      title: owner.name,
      email: owner.email,
      department: owner.teamId,
      isActive: owner.isActive !== false
    }));
  }, []);

  const formatTasksForCalendar = useCallback((tasksData) => {

    if (!Array.isArray(tasksData)) {
      console.warn(ERROR_MESSAGES.INVALID_TASKS_FORMAT);
      return [];
    }

    return tasksData.map(task => {
      const formattedTask = {
        id: task.id,
        title: task.title,
        start: task.start,
        end: task.end,
        resourceId: task.resourceId || null,
        allDay: true,
        extendedProps: {
          userId: task.userId,
          statusId: task.statusId || '1',
          description: task.description,
          originalTask: task,
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

      setHolidays(formatHolidays(holidayDates));
      setResources(formatResources(ownersData));
      setStatuses(statusesData);
      const formattedTasks = formatTasksForCalendar(tasksData, statusesData);
      console.log('Tâches formatées finales:', {
        total: formattedTasks,
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
    setTasks,
  };
};