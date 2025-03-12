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
  
    console.log('Dictionnaire d\'équipes:', teamDict);
  
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
      
      let startDate = task.start_date ? new Date(task.start_date) : new Date();
      let endDate = task.end_date ? new Date(task.end_date) : startDate;

      startDate.setDate(startDate.getDate() + 1);
      if (endDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      
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
    console.log('DÉBUT loadData -----');
    try {
      setIsLoading(true);
      setError(null);
      const year = new Date().getFullYear();
      
      console.log('Récupération des données depuis les API...');
      
      // Récupération des jours fériés
      console.log('Récupération des jours fériés...');
      let holidayDates = [];
      try {
        holidayDates = await fetchHolidays(year);
        console.log('Jours fériés récupérés:', holidayDates.length);
      } catch (err) {
        console.error('Erreur lors de la récupération des jours fériés:', err);
      }
      
      // Récupération des propriétaires
      console.log('Récupération des propriétaires...');
      let ownersData = [];
      try {
        ownersData = await fetchOwners();
        console.log('Propriétaires récupérés:', ownersData);
      } catch (err) {
        console.error('Erreur lors de la récupération des propriétaires:', err);
      }
      
      // Récupération des tâches
      console.log('Récupération des tâches...');
      let tasksData = [];
      try {
        tasksData = await fetchTasks();
        console.log('Tâches récupérées:', tasksData.length);
      } catch (err) {
        console.error('Erreur lors de la récupération des tâches:', err);
      }
      
      // Récupération des statuts
      console.log('Récupération des statuts...');
      let statusesData = [];
      try {
        statusesData = await fetchStatuses();
        console.log('Statuts récupérés:', statusesData.length);
      } catch (err) {
        console.error('Erreur lors de la récupération des statuts:', err);
      }
      
      // Récupération des équipes
      console.log('Récupération des équipes...');
      let teamsData = [];
      try {
        const fetchedTeams = await fetchTeams();
        console.log('Équipes récupérées (brut):', fetchedTeams);
        
        // Vérification et conversion
        if (Array.isArray(fetchedTeams)) {
          teamsData = fetchedTeams;
        } else if (fetchedTeams) {
          teamsData = [fetchedTeams];
        }
        
        console.log('Équipes récupérées (après traitement):', teamsData);
      } catch (err) {
        console.error('Erreur lors de la récupération des équipes:', err);
      }

      console.log('Formatage des données récupérées...');
      
      const formattedHolidays = formatHolidays(holidayDates);
      setHolidays(formattedHolidays);
      
      console.log('Appel à formatResources avec ownersData et teamsData:', ownersData, teamsData);
      const formattedResources = formatResources(ownersData, teamsData);
      console.log('Ressources formatées:', formattedResources);
      setResources(formattedResources);
      
      setStatuses(statusesData);
      
      const formattedTasks = formatTasksForCalendar(tasksData);
      setTasks(formattedTasks);
      
      console.log('Toutes les données ont été traitées et chargées');
    } catch (err) {
      console.error('Erreur générale dans loadData:', err);
      setError(err);
    } finally {
      setIsLoading(false);
      console.log('FIN loadData -----');
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