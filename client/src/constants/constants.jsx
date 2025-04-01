export const API_URL = process.env.REACT_APP_API_URL || '/api';

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
export const DEFAULT_STATUS_ID = 2;

// Messages d'erreur
export const ERROR_MESSAGES = {
  INVALID_DATE: 'Date invalide',
  INVALID_START_END_DATE: 'Dates invalides (week-end ou jour férié)',
  INVALID_TASK: 'Tâche invalide',
  TITLE_REQUIRED: 'Le titre est requis',
  SAVE_ERROR: 'Erreur lors de la sauvegarde',
  UPDATE_ERROR: 'Erreur lors de la mise à jour',
  DROP_ERROR: 'Erreur lors du déplacement',
  RESIZE_ERROR: 'Erreur lors du redimensionnement'
};

export const TEAM_BASE_COLORS = {
  team1: '#E63946', // Rouge
  team2: '#1D3557', // Bleu foncé
  team3: '#2A9D8F', // Vert
  team4: '#F4A261', // Orange
  team5: '#9B5DE5', // Violet
  team6: '#00BBF9', // Bleu clair
};
