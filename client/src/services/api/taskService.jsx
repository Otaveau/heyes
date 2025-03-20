import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';
import { ERROR_MESSAGES } from '../../constants/constants';
import { DateUtils } from '../../utils/dateUtils';


const transformTaskForServer = (taskData) => {
    const statusId = taskData.statusId || taskData.extendedProps?.statusId;
    
    // Capture des dates sous leurs formes originales
    let startDate = taskData.start || taskData.startDate;
    let endDate = taskData.end || taskData.endDate;
    
    console.log("Dates originales reçues par transformTaskForServer:", {
        start: startDate,
        end: endDate
    });
    
    // Pour s'assurer que les dates sont envoyées au format ISO sans heure/timezone
    const formattedStartDate = startDate ? DateUtils.toISODateString(startDate) : null;
    const formattedEndDate = endDate ? DateUtils.toISODateString(endDate) : null;
    
    console.log("Dates formatées envoyées au serveur:", {
        startFormatted: formattedStartDate,
        endFormatted: formattedEndDate
    });
    
    return {
        title: taskData.title.trim(),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        description: taskData.description?.trim() || '',
        ownerId: taskData.resourceId ? parseInt(taskData.resourceId, 10) : null,
        statusId: statusId
    };
};


const transformServerResponseToTask = (serverResponse) => {
    // Pas besoin de convertir les dates ici - le formatTasksForCalendar s'en chargera
    // Nous préservons les dates ISO telles quelles
    return {
        id: serverResponse.id,
        title: serverResponse.title,
        start_date: serverResponse.start_date,
        end_date: serverResponse.end_date,
        owner_id: serverResponse.owner_id || serverResponse.ownerId,
        allDay: true,
        extendedProps: {
            statusId: (serverResponse.status_id || serverResponse.statusId)?.toString(),
            userId: serverResponse.user_id || serverResponse.userId,
            description: serverResponse.description || ''
        }
    };
};


const validateTaskData = (taskData) => {
    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
    
    // Validation des dates - s'assurer qu'elles sont comparées dans le même format
    if (taskData.startDate && taskData.endDate) {
        // Utiliser les dates converties pour la validation
        if (new Date(taskData.endDate) < new Date(taskData.startDate)) {
            throw new Error(ERROR_MESSAGES.END_DATE_AFTER_START);
        }
    }
};

export const fetchTasks = async () => {
    try {
        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            headers: getAuthHeaders()
        });

        console.log('Réponse brute du serveur :', JSON.stringify(response));
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

        console.log('Données envoyées au serveur pour création:', dataToServer);

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
        
        console.log('Données envoyées au serveur pour mise à jour:', dataToServer);

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