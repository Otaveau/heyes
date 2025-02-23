import { useState, useEffect, useCallback, useRef } from 'react';
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

      return Object.keys(holidayDates).map(date => ({
        start: date,
        allDay: true
      }));
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

    return tasksData.map(task => ({
      id: task.id,
      title: task.title,
      start: task.start_date?.split('T')[0] || task.startDate?.split('T')[0],
      end: task.end_date?.split('T')[0] || task.endDate?.split('T')[0],
      resourceId: (task.owner_id || task.ownerId)?.toString(),
      allDay: true,
      extendedProps: {
        statusId: (task.status_id || task.statusId)?.toString(),
        userId: task.user_id || task.userId,
        description: task.description || ''
      }
    }));
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
    setTasks,
  };
};