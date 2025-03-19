import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTasks } from '../services/api/taskService';
import { fetchOwners } from '../services/api/ownerService';
import { fetchHolidays } from '../services/api/holidayService';
import { fetchStatuses } from '../services/api/statusService';
import { fetchTeams } from '../services/api/teamService';

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

  const formatResources = useCallback((ownersData, teamsData = []) => {
    const teamsArray = Array.isArray(teamsData) ? teamsData : [];
    const owners = Array.isArray(ownersData) ? ownersData : [];
    const teamDict = {};
    teamsArray.forEach(team => {
      if (team && team.team_id) {
        teamDict[team.team_id] = {
          id: team.team_id,
          name: team.name
        };
      }
    });

    const resources = [];
    owners.forEach(owner => {
      if (!owner) return;
      const teamId = owner.teamId;
      const teamName = teamId && teamDict[teamId] ? teamDict[teamId].name : `Équipe ${teamId}`;
      resources.push({
        id: owner.ownerId,
        title: owner.name || 'Propriétaire sans nom',
        parentId: `team_${teamId}`,
        extendedProps: {
          email: owner.email || '',
          teamId: teamId,
          teamName: teamName
        }
      });
    });

    Object.values(teamDict).forEach(team => {
      resources.push({
        id: `team_${team.id}`,
        title: team.name,
        extendedProps: {
          isTeam: true
        }
      });
    });

    return resources;
  }, []);

  // Dans useCalendarData.jsx - formatTasksForCalendar
  const formatTasksForCalendar = useCallback((tasksData) => {
    const tasks = Array.isArray(tasksData) ? tasksData : [];
  
    return tasks.map(task => {
      if (!task) return null;
  
      console.log('task :', task);
  
      // Vérifier si les dates sont null ou undefined
      if (!task.start_date || !task.end_date) {
        console.warn('Tâche avec dates nulles :', task.id, task.title);
        
        // Créer des dates par défaut (aujourd'hui) pour éviter les erreurs
        const today = new Date();
        const startDate = today;
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 1); // +1 jour pour l'exclusivité
        
        return {
          id: task.id,
          title: task.title || 'Tâche sans titre',
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
        };
      }
  
      // Si la date est au format ISO avec T23:00:00.000Z
      let startDateStr, endDateStr;
      
      // Extraire les parties date des chaînes ISO en vérifiant si elles existent
      if (typeof task.start_date === 'string' && task.start_date.includes('T')) {
        startDateStr = task.start_date.split('T')[0];
        endDateStr = task.end_date.split('T')[0];
      } else {
        // Format simple ou autre
        startDateStr = String(task.start_date);
        endDateStr = String(task.end_date);
      }
      
      let [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      let [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      
      // Vérifier si les valeurs sont des nombres valides
      if (isNaN(startYear) || isNaN(startMonth) || isNaN(startDay) ||
          isNaN(endYear) || isNaN(endMonth) || isNaN(endDay)) {
        console.warn('Tâche avec format de date invalide :', task.id, task.title);
        
        // Utiliser la date d'aujourd'hui comme repli
        const today = new Date();
        startYear = today.getFullYear();
        startMonth = today.getMonth() + 1;
        startDay = today.getDate();
        endYear = today.getFullYear();
        endMonth = today.getMonth() + 1;
        endDay = today.getDate() + 1;
      }
      
      // Si la date contient T23:00:00.000Z, ajouter un jour pour avoir le jour correct
      if (task.start_date && typeof task.start_date === 'string' && task.start_date.includes('T23:00:00.000Z')) {
        startDay += 1;
      }
      
      if (task.end_date && typeof task.end_date === 'string' && task.end_date.includes('T23:00:00.000Z')) {
        endDay += 1;
      }
      
      // Créer des dates UTC avec les jours ajustés
      const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      
      // Pour endDate, nous n'ajoutons PAS de jour supplémentaire si déjà ajusté pour T23:00:00.000Z
      const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));
      
      console.log('Dates finales pour FullCalendar:');
      console.log('startDate (UTC):', startDate.toISOString());
      console.log('endDate (UTC):', endDate.toISOString());
  
      return {
        id: task.id,
        title: task.title || 'Tâche sans titre',
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
      };
    }).filter(task => task !== null);
  }, []);


  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const year = new Date().getFullYear();

      let holidayDates = [];
      try {
        holidayDates = await fetchHolidays(year);
      } catch (err) {
        console.error('Erreur lors de la récupération des jours fériés:', err);
      }

      let ownersData = [];
      try {
        ownersData = await fetchOwners();
      } catch (err) {
        console.error('Erreur lors de la récupération des propriétaires:', err);
      }

      let tasksData = [];
      try {
        tasksData = await fetchTasks();
      } catch (err) {
        console.error('Erreur lors de la récupération des tâches:', err);
      }

      let statusesData = [];
      try {
        statusesData = await fetchStatuses();
      } catch (err) {
        console.error('Erreur lors de la récupération des statuts:', err);
      }

      let teamsData = [];
      try {
        const fetchedTeams = await fetchTeams();

        if (Array.isArray(fetchedTeams)) {
          teamsData = fetchedTeams;
        } else if (fetchedTeams) {
          teamsData = [fetchedTeams];
        }

      } catch (err) {
        console.error('Erreur lors de la récupération des équipes:', err);
      }

      const formattedHolidays = formatHolidays(holidayDates);
      setHolidays(formattedHolidays);

      const formattedResources = formatResources(ownersData, teamsData);
      setResources(formattedResources);

      setStatuses(statusesData);

      const formattedTasks = formatTasksForCalendar(tasksData);
      setTasks(formattedTasks);

    } catch (err) {
      console.error('Erreur générale dans loadData:', err);
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