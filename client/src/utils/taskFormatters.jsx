import { STATUS_COLORS, STATUS_TYPES } from "../constants/constants";

export const formatEventForCalendar = (task) => {
    if (!task || !task.id) {
        console.warn('Task invalide:', task);
        return null;
    }

    return {
        id: task.id,
        title: task.title || 'Sans titre',
        start: task.startDate,
        end: task.endDate,
        resourceId: task.resourceId,
        backgroundColor: getEventColor(task.status),
        borderColor: getEventColor(task.status),
        extendedProps: {
            status: task.status,
            isHoliday: Boolean(task.isHoliday)
        }
    };
};

export const getEventColor = (status) => {
    if (!status) {
        return STATUS_COLORS[STATUS_TYPES.ENTRANT];
    }
    return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS[STATUS_TYPES.ENTRANT];
};

export const getStatusId = (statusList, statusType) => {

    console.error('Liste de statuts :', statusList);
    console.error('statut type :',statusType);
    // Validation des paramètres
    if (!statusList || !Array.isArray(statusList)) {
        console.error('Liste de statuts invalide:', statusList);
        return null;
    }

    // Si pas de type fourni, retourner le statut "entrant" par défaut
    if (!statusType) {
        const defaultStatus = statusList.find(s =>
            s.statusType.toLowerCase().trim() === STATUS_TYPES.ENTRANT
        );
        if (defaultStatus) {
            return defaultStatus.statusId;
        }
        console.warn('Statut entrant non trouvé');
        return null;
    }

    // Si c'est déjà un ID numérique
    if (typeof statusType === 'number' || !isNaN(Number(statusType))) {
        const numericId = Number(statusType);
        // Vérifier si l'ID existe dans la liste
        if (statusList.some(s => s.statusId === numericId)) {
            return numericId;
        }
        console.warn(`ID de statut ${numericId} non trouvé`);
        return null;
    }

    // Recherche par type
    const normalizedType = statusType.toLowerCase().trim();
    const status = statusList.find(s =>
        s.statusType.toLowerCase().trim() === normalizedType
    );

    if (!status) {
        console.warn(`Statut '${statusType}' non trouvé`);
        return null;
    }

    return status.statusId;
};

export const formatTasksUtil = (tasksData, statusesData) => {
    // Validation des entrées
    if (!Array.isArray(tasksData) || !Array.isArray(statusesData)) {
      console.error('Données invalides:', { tasksData, statusesData });
      return [];
    }
  
    return tasksData.map(task => {
      // Validation des champs requis
      if (!task.id) {
        console.warn('Tâche sans ID détectée:', task);
        return null;
      }
  
      // Récupération du statusId
      let taskStatusId = task.statusId;
      
      // Si pas de statusId, essayer de le trouver via le type de statut
      if (!taskStatusId && task.status) {
        const matchingStatus = statusesData.find(s => 
          s.statusType.toLowerCase().trim() === task.status.toLowerCase().trim()
        );
        taskStatusId = matchingStatus?.statusId;
      }
  
      // Si toujours pas de status, utiliser le statut "entrant" par défaut
      if (!taskStatusId) {
        const defaultStatus = statusesData.find(s => 
          s.statusType.toLowerCase().trim() === STATUS_TYPES.ENTRANT
        );
        taskStatusId = defaultStatus?.statusId || statusesData[0]?.statusId || 0;
      }
  
      return {
        id: task.id,
        title: task.title || 'Sans titre',
        start: task.start_date || task.startDate || new Date().toISOString(),
        end: task.end_date || task.endDate || new Date().toISOString(),
        resourceId: task.owner_id || task.resourceId,
        statusId: taskStatusId,
        extendedProps: {
          description: task.description || '',
          originalStatus: task.status,
          isHoliday: Boolean(task.isHoliday)
        }
      };
    })
    .filter(Boolean);
  };