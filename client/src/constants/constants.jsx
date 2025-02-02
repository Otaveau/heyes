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

export const DEFAULT_TASK_DURATION = 24 * 60 * 60 * 1000;