export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const REQUEST_TIMEOUT = 30000; // 30 secondes

export const STATUS_TYPES = {
  ENTRANT: 'entrant',
  WIP: 'wip',
  EN_ATTENTE: 'en attente',
  DONE: 'done'
};

// IDs des statuts (number)
export const STATUS_IDS = {
  ENTRANT: 1,
  WIP: 2,
  EN_ATTENTE: 3,
  DONE: 4
};

// Mapping type vers ID
export const STATUS_TYPE_TO_ID = {
  [STATUS_TYPES.ENTRANT]: STATUS_IDS.ENTRANT,
  [STATUS_TYPES.WIP]: STATUS_IDS.WIP,
  [STATUS_TYPES.EN_ATTENTE]: STATUS_IDS.EN_ATTENTE,
  [STATUS_TYPES.DONE]: STATUS_IDS.DONE
};

// Mapping ID vers type
export const STATUS_ID_TO_TYPE = {
  [STATUS_IDS.ENTRANT]: STATUS_TYPES.ENTRANT,
  [STATUS_IDS.WIP]: STATUS_TYPES.WIP,
  [STATUS_IDS.EN_ATTENTE]: STATUS_TYPES.EN_ATTENTE,
  [STATUS_IDS.DONE]: STATUS_TYPES.DONE
};

export const STATUS_COLORS = {
  entrant: '#60A5FA',
  wip: '#34D399',
  completed: '#A78BFA',
  blocked: '#F87171'
};

export const TOAST_CONFIG = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

export const DEFAULT_TASK_DURATION = 24 * 60 * 60 * 1000;

// Messages d'erreur
export const ERROR_MESSAGES = {
  INVALID_DATE: 'Date invalide',
  INVALID_START_END_DATE: 'La tâche ne peut pas commencer ou se terminer sur un week-end ou un jour férié',
  INVALID_TASK: 'Tâche invalide',
  TITLE_REQUIRED: 'Le titre est requis',
  SAVE_ERROR: 'Erreur lors de la sauvegarde',
  UPDATE_ERROR: 'Erreur lors de la mise à jour',
  DROP_ERROR: 'Erreur lors du déplacement',
  RESIZE_ERROR: 'Erreur lors du redimensionnement'
};
