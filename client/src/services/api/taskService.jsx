import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';
import { ERROR_MESSAGES} from '../../constants/constants';
import { DateUtils } from '../../utils/dateUtils';
import { DateTime } from 'luxon';


// Validateurs de données
const validateTaskData = (taskData) => {

    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);

    if (!taskData.startDate) throw new Error(ERROR_MESSAGES.START_DATE_REQUIRED);
    if (!taskData.endDate) throw new Error(ERROR_MESSAGES.END_DATE_REQUIRED);

    const start = DateTime.fromISO(DateUtils.formatLocalDate(taskData.startDate));
    const end = DateTime.fromISO(DateUtils.formatLocalDate(taskData.endDate));

    if (!start.isValid) throw new Error(ERROR_MESSAGES.INVALID_START_DATE);
    if (!end.isValid) throw new Error(ERROR_MESSAGES.INVALID_END_DATE);
    if (end < start) throw new Error(ERROR_MESSAGES.END_DATE_AFTER_START);
};


const prepareTaskData = (taskData) => {
    return {
        ...taskData,
        startDate: DateUtils.formatLocalDate(taskData.startDate),
        endDate: DateUtils.formatLocalDate(taskData.endDate)
    };
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
        const preparedData = prepareTaskData(taskData);
        
        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(preparedData)
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

        const preparedData = prepareTaskData(taskData);
        console.log('FE updateTask taskData', preparedData);

        const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(preparedData)
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