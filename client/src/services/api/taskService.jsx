import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';
import { ERROR_MESSAGES } from '../../constants/constants';
import { DateUtils } from '../../utils/dateUtils';



const transformTaskForServer = (taskData) => {
    return {
        title: taskData.title.trim(),
        startDate: taskData.start ? new Date(taskData.start).toISOString() : null,
        endDate: taskData.end ? new Date(taskData.end).toISOString() : null,
        description: taskData.description?.trim() || '',
        ownerId: taskData.resourceId ? parseInt(taskData.resourceId, 10) : null,
        statusId: taskData.statusId ? parseInt(taskData.statusId, 10) : null
    };
};

const transformServerResponseToTask = (serverResponse) => {

    DateUtils.normalizeTaskDates(serverResponse);
  
    return {
        id: serverResponse.id,
        title: serverResponse.title,
        start: serverResponse.start_Date || null,
        end: serverResponse.end_Date || null,
        resourceId: (serverResponse.owner_id || serverResponse.ownerId)?.toString(),
        allDay: true,
        extendedProps: {
            statusId: (serverResponse.status_id || serverResponse.statusId)?.toString(),
            userId: serverResponse.user_id || serverResponse.userId,
            description: serverResponse.description || ''
        }
    };
};

// Validateurs de données
const validateTaskData = (taskData) => {

    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
    if (taskData.endDate < taskData.startDate) throw new Error(ERROR_MESSAGES.END_DATE_AFTER_START);
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
        const dataToServer = transformTaskForServer(taskData);

        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dataToServer)
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

        const dataToServer = transformTaskForServer(taskData);

        const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dataToServer)
        });

        // Obtenir les données JSON de la réponse
        const dataFromServer = await handleResponse(response);

        const transformedTask = transformServerResponseToTask(dataFromServer);

        return transformedTask;

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

