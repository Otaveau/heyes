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
    
    // Créer un dictionnaire des équipes
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
    
    // Créer les ressources de propriétaire avec parentId
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
    
    // Ajouter les équipes comme entrées distinctes
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

  const formatTasksForCalendar = useCallback((tasksData) => {
    const tasks = Array.isArray(tasksData) ? tasksData : [];
    
    return tasks.map(task => {
      if (!task) return null;

      //console.log('task :', task);
      
      let startDate = task.start_date ? new Date(task.start_date) : new Date();
      let endDate = task.end_date ? new Date(task.end_date) : startDate;

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