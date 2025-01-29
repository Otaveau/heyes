const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('token');
    return token
      ? {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      : { 'Content-Type': 'application/json' };
  } catch (error) {
    console.error('Storage access error:', error);
    return { 'Content-Type': 'application/json' };
  }
};

export const validateToken = async (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const response = await fetch(`${API_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('Token validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
};

// Auth APIs
export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return handleResponse(response);
};

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return handleResponse(response);
};

// Task APIs
export const getTasks = async () => {
  const response = await fetch(`${API_URL}/tasks`, {
    headers: getAuthHeaders()
  });
  console.log('response Task : ', response);
  return handleResponse(response);
};

// Task APIs
export const createTask = async (taskData) => {
  // Conversion des noms de champs pour la cohérence
  const formattedData = {
    title: taskData.title,
    start_date: taskData.startDate,
    end_date: taskData.endDate,
    owner_id: taskData.ownerId,
    status_id: taskData.statusId // Utiliser status_id au lieu de status
  };

  console.log('Formatted task data:', formattedData);
  
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(formattedData)
  });
  return handleResponse(response);
};

export const updateTask = async (id, taskData) => {
  // Conversion des noms de champs pour la cohérence
  const formattedData = {
    title: taskData.title,
    start_date: taskData.startDate,
    end_date: taskData.endDate,
    owner_id: taskData.ownerId,
    status_id: taskData.statusId // Utiliser status_id au lieu de status
  };

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(formattedData)
  });
  return handleResponse(response);
};

export const updateTaskStatus = async (taskId, statusId) => {
  try {
    console.log('Updating task status:', { taskId, status_id: statusId });
    
    const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        statusId: parseInt(statusId) // Garder statusId pour la compatibilité avec le controller
      })
    });

    const data = await response.json();
    console.log('Update status response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update task status');
    }

    return data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getTasksByStatus = async (statusId) => {
  const response = await fetch(`${API_URL}/tasks/status/${statusId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getTasksByOwner = async (ownerId) => {
  const response = await fetch(`${API_URL}/tasks/owner/${ownerId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const updateTaskOwner = async (id, ownerId) => {
  const response = await fetch(`${API_URL}/tasks/${id}/owner`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ownerId })
  });
  return handleResponse(response);
};

// Team APIs
export const getTeams = async () => {
  const response = await fetch(`${API_URL}/teams`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getTeamById = async (id) => {
  const response = await fetch(`${API_URL}/teams/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const createTeam = async (teamData) => {
  const response = await fetch(`${API_URL}/teams`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(teamData)
  });
  return handleResponse(response);
};

export const updateTeam = async (id, teamData) => {
  const response = await fetch(`${API_URL}/teams/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(teamData)
  });
  return handleResponse(response);
};

export const deleteTeam = async (id) => {
  const response = await fetch(`${API_URL}/teams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getTeamOwners = async (teamId) => {
  const response = await fetch(`${API_URL}/teams/${teamId}/owners`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Owner APIs
export const getOwners = async () => {
  const response = await fetch(`${API_URL}/owners`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getOwnerById = async (id) => {
  const response = await fetch(`${API_URL}/owners/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const createOwner = async (ownerData) => {
  const response = await fetch(`${API_URL}/owners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(ownerData)
  });
  return handleResponse(response);
};

export const updateOwner = async (id, ownerData) => {
  const response = await fetch(`${API_URL}/owners/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(ownerData)
  });
  return handleResponse(response);
};

export const deleteOwner = async (id) => {
  const response = await fetch(`${API_URL}/owners/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getOwnerTasks = async (ownerId) => {
  const response = await fetch(`${API_URL}/owners/${ownerId}/tasks`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Status APIs
export const getStatuses = async () => {
  const response = await fetch(`${API_URL}/status`, {
    headers: getAuthHeaders()
  });
  console.log('response Status : ', response);
  return handleResponse(response);
};

export const createStatus = async (statusData) => {
  const response = await fetch(`${API_URL}/status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(statusData)
  });
  return handleResponse(response);
};

export const updateStatus = async (id, statusData) => {
  const response = await fetch(`${API_URL}/status/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(statusData)
  });
  return handleResponse(response);
};

export const deleteStatus = async (id) => {
  const response = await fetch(`${API_URL}/status/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Holidays API
export const fetchHolidays = async (year) => {
  const response = await fetch(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`);
  return handleResponse(response);
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
    const errorText = await response.text();
    throw new Error(errorText || 'Erreur API');
  }
  return response.json();
};