import { useState, useEffect } from 'react';
import { fetchHolidays, getOwners, getTasks, getStatuses } from '../services/apiService';

export const useCalendarData = () => {
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Début du chargement des données');

        const [holidayDates, ownersData, tasksData, statusesData] = await Promise.all([
          fetchHolidays(new Date().getFullYear()),
          getOwners(),
          getTasks(),
          getStatuses()
        ]);

        console.log('Données brutes tasks:', tasksData);
        console.log('Données brutes statuses:', statusesData);

        // Formatage des jours fériés
        const formattedHolidays = Object.keys(holidayDates).map(date => {
          const [year, month, day] = date.split('-');
          const utcDate = new Date(Date.UTC(year, month - 1, day));
          return utcDate.toISOString().split('T')[0];
        });
        setHolidays(formattedHolidays);

        // Formatage des tâches
        const formattedTasks = tasksData.map(task => {
          const taskStatusId = task.status_id || findStatusIdByType(statusesData, task.status);

          return {
            id: task.id,
            title: task.title,
            start: task.start_date,
            end: task.end_date,
            resourceId: task.owner_id,
            status_id: taskStatusId  // Utiliser status_id au lieu de status
          };
        });

        console.log('Tâches formatées:', formattedTasks);
        setTasks(formattedTasks);

        // Formatage des ressources
        const formattedOwners = ownersData.map(owner => ({
          id: owner.owner_id,
          title: owner.name
        }));
        setResources(formattedOwners);

        console.log('Statuts chargés:', statusesData);
        setStatuses(statusesData);

      } catch (error) {
        console.error('Erreur de chargement:', error);
      }
    };

    loadInitialData();
  }, []);

  // Fonction utilitaire pour trouver l'ID du statut par type
  const findStatusIdByType = (statusList, statusType) => {
    if (!statusType) {
      const entrantStatus = statusList.find(s => s.status_type.toLowerCase() === 'entrant');
      return entrantStatus?.status_id;
    }
    
    // Si c'est déjà un ID
    if (!isNaN(statusType)) {
      return parseInt(statusType);
    }
    
    // Chercher par type
    const status = statusList.find(s => s.status_type.toLowerCase() === statusType.toLowerCase());
    return status?.status_id;
  };

  useEffect(() => {
    console.log('État mis à jour - tasks:', tasks);
    console.log('État mis à jour - statuses:', statuses);
  }, [tasks, statuses]);

  return { tasks, setTasks, resources, holidays, statuses };
};