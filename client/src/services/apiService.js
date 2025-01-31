import { API_URL } from "../constants/constants";


// Task APIs
export const fetchTasks = async () => {
  const response = await fetch(`${API_URL}/tasks`, {
    headers: getAuthHeaders()
  });
  
  const tasks = await handleResponse(response);
  console.log('fetchTasks tasks : ', tasks);

  const formattedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    startDate: task.start_date,
    endDate: task.end_date,
    ownerId: task.owner_id,
    statusId: task.status_id,
    userId: task.user_id
  }));

  console.log('formatted Tasks:', formattedTasks);
  return formattedTasks;
};

export const createTask = async (taskData) => {
  console.log('createTask taskData:', taskData);

  const formattedData = {
    title: taskData.title,
    startDate: taskData.startDate,
    endDate: taskData.endDate,
    ownerId: taskData.ownerId,
    statusId: taskData.statusId
  };
  console.log('createTask formattedData:', formattedData);

  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formattedData)
  });
  return handleResponse(response);
};

export const updateTask = async (id, taskData) => {
  console.log('updateTask taskData:', taskData);

  const taskId = parseInt(id);
  const formattedData = {
    title: taskData.title,
    startDate: taskData.startDate,
    endDate: taskData.endDate,
    ownerId: taskData.ownerId,
    statusId: taskData.statusId
  };
  console.log('updateTask formattedData:', formattedData);
  
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedData)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error in updateTask:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, statusId) => {
  try {
    console.log('Updating task status:', { taskId, statusId });

    const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        statusId: parseInt(statusId)
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


// Owner APIs
export const fetchOwners = async () => {
  const response = await fetch(`${API_URL}/owners`, {
    headers: getAuthHeaders()
  });

  const owners = await handleResponse(response);
  console.log('response owners : ', owners);

  const formattedOwners = owners.map(owner => ({
    id: owner.id,
    ownerId: owner.owner_id,
    name: owner.name,
    email: owner.email,
    teamId: owner.team_id,
    userId: owner.user_id
  }));

  console.log('formatted Owners:', formattedOwners);
  return formattedOwners;
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


// Team APIs
export const fetchTeams = async () => {
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


// Status APIs
export const fetchStatuses = async () => {
  const response = await fetch(`${API_URL}/status`, {
    headers: getAuthHeaders()
  });
  console.log('response Status : ', response);
  return handleResponse(response);
};

// Holidays API
export const fetchHolidays = async (year) => {
  const response = await fetch(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`);
  return handleResponse(response);
};


// Auth API
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