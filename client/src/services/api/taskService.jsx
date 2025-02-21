import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';
import { ERROR_MESSAGES, STATUS_TYPE_TO_ID, STATUS_ID_TO_TYPE } from "../../constants/constants";

// Validateurs de données
const validateTaskData = (taskData) => {
    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
    if (!taskData.start) throw new Error(ERROR_MESSAGES.START_DATE_REQUIRED);
    if (!taskData.end) throw new Error(ERROR_MESSAGES.END_DATE_REQUIRED);

    const start = new Date(taskData.start);
    const end = new Date(taskData.end);

    if (isNaN(start.getTime())) throw new Error(ERROR_MESSAGES.INVALID_START_DATE);
    if (isNaN(end.getTime())) throw new Error(ERROR_MESSAGES.INVALID_END_DATE);
    if (end < start) throw new Error(ERROR_MESSAGES.END_DATE_AFTER_START);
};

const handleFetchError = (error, action) => {
    console.error(`Erreur lors de ${action}:`, error);
    throw error;
};

const formatTaskData = (taskData) => ({
    title: taskData.title.trim(),
    startDate: taskData.start,
    endDate:taskData.end,
    description: taskData.description?.trim() || '',
    ownerId: taskData.resourceId,
    statusId: taskData.statusId
});


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
            resourceId: task.owner_id,
            statusId: task.status_id,
            userId: task.user_id
        }));

    } catch (error) {
        handleFetchError(error, 'la récupération des tâches');
    }
};

export const createTask = async (taskData) => {
    try {
        validateTaskData(taskData);
        const formattedData = formatTaskData(taskData);

        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formattedData)
        });

        return handleResponse(response);
    } catch (error) {
        handleFetchError(error, 'la création de la tâche');
    }
};

export const updateTask = async (id, taskData) => {
    try {
        validateTaskData(taskData);
        const taskId = parseInt(id);
        if (isNaN(taskId)) throw new Error(ERROR_MESSAGES.TASK_ID_REQUIRED);

        const formattedData = formatTaskData(taskData);

        const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formattedData)
        });

        return handleResponse(response);
    } catch (error) {
        handleFetchError(error, 'la mise à jour de la tâche');
    }
};

export const deleteTask = async (id) => {
    try {
        if (!id) throw new Error(ERROR_MESSAGES.TASK_ID_REQUIRED);

        const response = await fetchWithTimeout(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        handleFetchError(error, 'la suppression de la tâche');
    }
};

export const getTasksByStatus = async (statusId) => {
    try {
        if (!statusId) throw new Error(ERROR_MESSAGES.STATUS_ID_REQUIRED);

        const response = await fetchWithTimeout(`${API_URL}/tasks/status/${statusId}`, {
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        handleFetchError(error, 'la récupération des tâches par statut');
    }
};

export const getStatusIdFromType = (statusType) => {
    const normalizedType = statusType?.toLowerCase().trim();
    return STATUS_TYPE_TO_ID[normalizedType] || null;
};

export const getStatusTypeFromId = (statusId) => {
    const numericId = Number(statusId);
    return STATUS_ID_TO_TYPE[numericId] || null;
};
