import { useState, useEffect, useCallback, useRef } from 'react';
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

    console.log('ownersData :', ownersData);
    return ownersData.map(owner => ({
      id: owner.ownerId,
      title: owner.name,
      email: owner.email,
      team: owner.teamId   
    }));
  }, []);


  const formatTasksForCalendar = useCallback((tasksData) => {

    return tasksData.map(task => {

      let startDate = new Date(task.start_date);
      let endDate = task.end_date ? new Date(task.end_date) : startDate;

      startDate.setDate(startDate.getDate() + 1);
      if (endDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      return {
        id: task.id,
        title: task.title,
        start: startDate,
        end: endDate,
        resourceId: (task.owner_id || task.ownerId)?.toString(),
        allDay: true,
        extendedProps: {
          statusId: (task.status_id || task.statusId)?.toString(),
          userId: task.user_id || task.userId,
          description: task.description || '',
          team: task.team_name,
        }
      }
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

      console.table('tasksData :', tasksData);

      const formattedTasks = formatTasksForCalendar(tasksData, statusesData);

      console.table('formattedTasks :', formattedTasks);

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