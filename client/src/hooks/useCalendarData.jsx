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
        title: owner.name || 'Membre sans nom',
        parentId: `team_${teamId}`,
        extendedProps: {
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

  // Fonction mise à jour pour standardiser le traitement des dates
  const formatTasks = useCallback((tasksData) => {
    const tasks = Array.isArray(tasksData) ? tasksData : [];

    return tasks.map(task => {
      if (!task) return null;

      // Gestion précise des dates
      const startDate = task.start_date || null;

      // Date inclusive (celle stockée en BDD)
      const inclusiveEndDate = task.end_date|| null;

      // Date exclusive pour FullCalendar (jour suivant la date de fin inclusive)
      const exclusiveEndDate = inclusiveEndDate ? new Date(inclusiveEndDate) : null;
      if (exclusiveEndDate) {
        exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
      }

      return {
        id: task.id,
        title: task.title || 'Tâche sans titre',
        start: startDate,
        end: exclusiveEndDate, // Date exclusive pour FullCalendar
        resourceId: (task.owner_id || task.ownerId)?.toString(),
        allDay: true,
        extendedProps: {
          statusId: (task.status_id || task.statusId || task.extendedProps?.statusId)?.toString(),
          userId: task.user_id || task.userId || task.extendedProps?.userId,
          description: task.description || task.extendedProps?.description || '',
          team: task.team_name || task.extendedProps?.teamName,
          ownerName: task.owner_name || task.extendedProps?.ownerName,
          statusType: task.status_type || task.extendedProps?.statusType,

          // Ajout des informations de dates supplémentaires
          startDate: startDate,
          inclusiveEndDate: inclusiveEndDate, // Date inclusive (jour inclus dans l'événement)
          exclusiveEndDate: exclusiveEndDate  // Date exclusive (jour non inclus)
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

      const formattedTasks = formatTasks(tasksData);
      setTasks(formattedTasks);

    } catch (err) {
      console.error('Erreur générale dans loadData:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [formatHolidays, formatResources, formatTasks]);

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