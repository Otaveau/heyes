export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const REQUEST_TIMEOUT = 30000; // 30 secondes

export const STATUS_TYPES = {
  ENTRANT: 'entrant',
  WIP: 'wip',
  EN_ATTENTE: 'en attente',
  DONE: 'done'
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
  TASK_DATA_REQUIRED: 'Données de tâche requises',
  TITLE_REQUIRED: 'Titre requis',
  START_DATE_REQUIRED: 'Date de début requise',
  END_DATE_REQUIRED: 'Date de fin requise',
  INVALID_START_DATE: 'Date de début invalide',
  INVALID_END_DATE: 'Date de fin invalide',
  END_DATE_AFTER_START: 'La date de fin doit être après la date de début',
  TASK_ID_REQUIRED: 'ID de tâche requis',
  STATUS_ID_REQUIRED: 'ID de statut requis',
  INVALID_HOLIDAY_FORMAT: 'Invalid holiday dates format received',
  INVALID_OWNERS_FORMAT: 'Invalid owners data format received',
  TASK_NOT_FOUND: 'Task with id {id} not found',
  ERROR_UPDATING_TASK: 'Error updating task',
  ERROR_ADDING_TASK: 'Error adding task',
  SAVE_ERROR: 'Erreur lors de la sauvegarde',
  STATUS_UPDATE_ERROR: 'Erreur lors de la mise à jour du statut',
  DATA_LOAD_ERROR: 'Erreur de chargement des données',
  INVALID_TASK: 'Tentative de click sur une tâche invalide',
  RESIZE_ERROR: 'Erreur lors du redimensionnement',
  DROP_ERROR: 'Erreur lors du déplacement',
  END_DATE_VALIDATION: 'La date de fin doit être postérieure à la date de début',
  STATUS_REQUIRED: 'Le statut est requis',
  SUBMIT_ERROR: 'Une erreur est survenue lors de la soumission du formulaire',
  WIP_VALIDATION: 'Pour le statut WIP, vous devez sélectionner {fields}',
  INVALID_DATE: 'Invalid date input',
  ERROR_IS_HOLIDAY: 'Error in isHoliday:',
  ERROR_IS_HOLIDAY_OR_WEEKEND: 'Error in isHolidayOrWeekend:',
  ERROR_FORMAT_UTC_DATE: 'Error in formatUTCDate:',
  STATUS_NOT_FOUND: 'Statut non trouvé',
  INVALID_DATA: 'Données invalides:',
  TASK_WITHOUT_ID: 'Tâche sans ID détectée:',
  INVALID_PARAMS: 'Paramètres invalides pour syncTaskWithBacklog:',
};
