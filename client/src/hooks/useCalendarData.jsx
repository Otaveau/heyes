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
      return holidayDates;
  }, []);


  const formatResources = useCallback((ownersData) => {
    return ownersData.map(owner => ({
      id: owner.ownerId,
      title: owner.name,
      email: owner.email,
      team: owner.teamId
    }));
  }, []);


  const formatTasksForCalendar = useCallback((tasksData) => {
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