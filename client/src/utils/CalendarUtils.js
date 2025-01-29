export const formatEventForCalendar = (task) => ({
  id: task.id,
  title: task.title,
  start: task.startDate,
  end: task.endDate,
  resourceId: task.resourceId,
  backgroundColor: getEventColor(task.status),
  borderColor: getEventColor(task.status),
  extendedProps: {
    status: task.status,
    isHoliday: task.isHoliday
  }
});

export const getEventColor = (status) => {
  const colors = {
    entrant: '#60A5FA',
    wip: '#34D399',
    completed: '#A78BFA',
    blocked: '#F87171'
  };
  return colors[status] || colors.entrant;
};


// Fonction utilitaire pour obtenir l'ID du statut par son type
export const getStatusIdByType = (type, statuses) => {
  if (!type || !statuses || !Array.isArray(statuses)) {
    console.error('Type ou statuses invalides:', { type, statuses });
    return null;
  }
  const normalizedType = type.toLowerCase().trim();
  const status = statuses.find(s =>
    s.status_type.toLowerCase().trim() === normalizedType
  );
  if (!status) {
    console.warn(`Statut '${type}' non trouvé dans:`, statuses);
    return null;
  }
  return status.status_id;
};

// Pour synchroniser les tasks
export const syncTaskWithBacklog = (task, sourceType) => {
  const baseTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    startDate: task.start,
    endDate: task.end,
    resourceId: task.resourceId,
    status: task.status
  };

  if (sourceType === 'calendar') {
    // Créer une copie dans le backlog WIP
    return {
      ...baseTask,
      status: getStatusIdByType('wip')
    };
  } else {
    // Créer une copie dans le calendrier
    return {
      ...baseTask,
      resourceId: task.resourceId,
      status: getStatusIdByType('wip')
    };
  }
};
