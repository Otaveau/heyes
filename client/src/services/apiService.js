import { API_URL } from "../constants/constants";
import { formatUTCDate } from "../utils/dateUtils";

// Types d'erreurs personnalisés
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Session expirée') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

// Configuration des requêtes
const REQUEST_TIMEOUT = 30000; // 30 secondes

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Gestionnaire de réponse générique
const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new AuthenticationError();
    }
    
    const errorData = await response.text();
    let errorMessage;
    try {
      const parsedError = JSON.parse(errorData);
      errorMessage = parsedError.message || parsedError.error || 'Erreur API';
    } catch {
      errorMessage = errorData || 'Erreur API';
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  return response.json();
};

// Gestionnaire d'en-têtes d'authentification
const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  } catch (error) {
    console.error('Erreur d\'accès au stockage:', error);
    return { 'Content-Type': 'application/json' };
  }
};

// Validateurs de données
const validateTaskData = (taskData) => {
  if (!taskData) throw new Error('Données de tâche requises');
  if (!taskData.title?.trim()) throw new Error('Titre requis');
  if (!taskData.startDate) throw new Error('Date de début requise');
  if (!taskData.endDate) throw new Error('Date de fin requise');
  
  const start = new Date(taskData.startDate);
  const end = new Date(taskData.endDate);
  
  if (isNaN(start.getTime())) throw new Error('Date de début invalide');
  if (isNaN(end.getTime())) throw new Error('Date de fin invalide');
  if (end < start) throw new Error('La date de fin doit être après la date de début');
};

// Task APIs
export const fetchTasks = async () => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/tasks`, {
      headers: getAuthHeaders()
    });
    
    const tasks = await handleResponse(response);
    
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      startDate: task.start_date,
      endDate: task.end_date,
      description: task.description || '',
      ownerId: task.owner_id,
      statusId: task.status_id,
      userId: task.user_id
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    validateTaskData(taskData);

    const formattedData = {
      title: taskData.title.trim(),
      startDate: formatUTCDate(taskData.startDate),
      endDate: formatUTCDate(taskData.endDate),
      description: taskData.description?.trim() || '',
      ownerId: taskData.ownerId,
      statusId: taskData.statusId
    };

    const response = await fetchWithTimeout(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(formattedData)
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    throw error;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    validateTaskData(taskData);
    
    const taskId = parseInt(id);
    if (isNaN(taskId)) throw new Error('ID de tâche invalide');

    const formattedData = {
      title: taskData.title.trim(),
      startDate: formatUTCDate(taskData.startDate),
      endDate: formatUTCDate(taskData.endDate),
      description: taskData.description?.trim() || '',
      ownerId: taskData.ownerId,
      statusId: taskData.statusId
    };

    const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(formattedData)
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, statusId) => {
  try {
    if (!taskId) throw new Error('ID de tâche requis');
    if (!statusId) throw new Error('ID de statut requis');

    const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        statusId: parseInt(statusId)
      })
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    if (!id) throw new Error('ID de tâche requis');

    const response = await fetchWithTimeout(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    throw error;
  }
};

export const getTasksByStatus = async (statusId) => {
  try {
    if (!statusId) throw new Error('ID de statut requis');

    const response = await fetchWithTimeout(`${API_URL}/tasks/status/${statusId}`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches par statut:', error);
    throw error;
  }
};

// Owner APIs
export const fetchOwners = async () => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/owners`, {
      headers: getAuthHeaders()
    });

    const owners = await handleResponse(response);

    return owners.map(owner => ({
      id: owner.id,
      ownerId: owner.owner_id,
      name: owner.name,
      email: owner.email,
      teamId: owner.team_id,
      userId: owner.user_id
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des propriétaires:', error);
    throw error;
  }
};

export const getOwnerById = async (id) => {
  try {
    if (!id) throw new Error('ID de propriétaire requis');

    const response = await fetchWithTimeout(`${API_URL}/owners/${id}`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la récupération du propriétaire:', error);
    throw error;
  }
};

export const createOwner = async (ownerData) => {
  try {
    if (!ownerData?.name?.trim()) throw new Error('Nom de propriétaire requis');

    const response = await fetchWithTimeout(`${API_URL}/owners`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ownerData)
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la création du propriétaire:', error);
    throw error;
  }
};

export const updateOwner = async (id, ownerData) => {
  try {
    if (!id) throw new Error('ID de propriétaire requis');
    if (!ownerData?.name?.trim()) throw new Error('Nom de propriétaire requis');

    const response = await fetchWithTimeout(`${API_URL}/owners/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(ownerData)
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du propriétaire:', error);
    throw error;
  }
};

export const deleteOwner = async (id) => {
  try {
    if (!id) throw new Error('ID de propriétaire requis');

    const response = await fetchWithTimeout(`${API_URL}/owners/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la suppression du propriétaire:', error);
    throw error;
  }
};

export const getOwnerTasks = async (ownerId) => {
  try {
    if (!ownerId) throw new Error('ID de propriétaire requis');

    const response = await fetchWithTimeout(`${API_URL}/owners/${ownerId}/tasks`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches du propriétaire:', error);
    throw error;
  }
};

// Team APIs
const validateTeamData = (teamData) => {
  if (!teamData) throw new Error('Données d\'équipe requises');
  if (!teamData.name?.trim()) throw new Error('Nom d\'équipe requis');
};

export const fetchTeams = async () => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/teams`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes:', error);
    throw error;
  }
};

export const getTeamById = async (id) => {
  try {
    if (!id) throw new Error('ID d\'équipe requis');
    
    const response = await fetchWithTimeout(`${API_URL}/teams/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'équipe:', error);
    throw error;
  }
};

export const createTeam = async (teamData) => {
  try {
    validateTeamData(teamData);

    const response = await fetchWithTimeout(`${API_URL}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: teamData.name.trim(),
        description: teamData.description?.trim() || ''
      })
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la création de l\'équipe:', error);
    throw error;
  }
};

export const updateTeam = async (id, teamData) => {
  try {
    if (!id) throw new Error('ID d\'équipe requis');
    validateTeamData(teamData);

    const response = await fetchWithTimeout(`${API_URL}/teams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: teamData.name.trim(),
        description: teamData.description?.trim() || ''
      })
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'équipe:', error);
    throw error;
  }
};

export const deleteTeam = async (id) => {
  try {
    if (!id) throw new Error('ID d\'équipe requis');

    const response = await fetchWithTimeout(`${API_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'équipe:', error);
    throw error;
  }
};

export const getTeamOwners = async (teamId) => {
  try {
    if (!teamId) throw new Error('ID d\'équipe requis');

    const response = await fetchWithTimeout(`${API_URL}/teams/${teamId}/owners`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des membres de l\'équipe:', error);
    throw error;
  }
};

// Status APIs
export const fetchStatuses = async () => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/status`, {
      headers: getAuthHeaders()
    });

    const statuses = await handleResponse(response);

    return statuses.map(status => ({
      id: status.id,
      statusId: status.status_id,
      statusType: status.status_type,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des statuts:', error);
    throw error;
  }
};

// Holidays API
export const fetchHolidays = async (year) => {
  try {
    if (!year || isNaN(year)) {
      throw new Error('Année invalide');
    }

    const response = await fetchWithTimeout(
      `https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`,
      { headers: { Accept: 'application/json' } }
    );

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des jours fériés:', error);
    throw error;
  }
};


// Auth API
export const validateToken = async (token) => {
  if (!token) throw new Error('Token requis');

  try {
    const response = await fetchWithTimeout(`${API_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur de validation du token:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  if (!credentials?.email || !credentials?.password) {
    throw new Error('Email et mot de passe requis');
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
};

export const register = async (userData) => {
  if (!userData?.email || !userData?.password || !userData?.name) {
    throw new Error('Email, mot de passe et nom requis');
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    throw error;
  }
};