import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';
import { ERROR_MESSAGES} from "../../constants/constants";

// Validateurs de données
const validateTaskData = (taskData) => {

    console.log('taskData :', taskData);

    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
    if (!taskData.startDate) throw new Error(ERROR_MESSAGES.START_DATE_REQUIRED);
    if (!taskData.endDate) throw new Error(ERROR_MESSAGES.END_DATE_REQUIRED);

    const start = new Date(taskData.startDate);
    const end = new Date(taskData.endDate);

    if (isNaN(start.getTime())) throw new Error(ERROR_MESSAGES.INVALID_START_DATE);
    if (isNaN(end.getTime())) throw new Error(ERROR_MESSAGES.INVALID_END_DATE);
    if (end < start) throw new Error(ERROR_MESSAGES.END_DATE_AFTER_START);
};


export const fetchTasks = async () => {
    try {
        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        throw error;
    }
};

export const createTask = async (taskData) => {
    try {
        validateTaskData(taskData);
        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
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
        if (isNaN(taskId)) throw new Error(ERROR_MESSAGES.TASK_ID_REQUIRED);

        const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        throw error;
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
        console.error(error, 'la suppression de la tâche');
        throw error;
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
        console.error(error, 'la récupération des tâches par statut');
        throw error;
    }
};