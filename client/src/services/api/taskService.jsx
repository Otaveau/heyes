import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';
import { ERROR_MESSAGES } from '../../constants/constants';


const transformTaskForServer = (taskData) => {
    const statusId = taskData.statusId || taskData.extendedProps?.statusId;
    let startDate = taskData.start || taskData.startDate;
    let endDate;
    const isNewTask = !taskData.id;

    // Prioriser extendedProps.inclusiveEndDate quelle que soit la situation (nouvelle tâche ou mise à jour)
    if (taskData.extendedProps?.inclusiveEndDate) {
        endDate = taskData.extendedProps.inclusiveEndDate;
    } 
    // Si pas d'inclusiveEndDate, traiter selon création ou modification
    else if (isNewTask) {
        // Pour les nouvelles tâches sans inclusiveEndDate explicite
        if (taskData.endDate) {
            // Si on a endDate, l'utiliser directement (supposé être inclusive)
            endDate = taskData.endDate;
        } else if (taskData.end) {
            // Si on a seulement end, convertir de exclusive à inclusive
            const endDateObj = new Date(taskData.end);
            endDateObj.setDate(endDateObj.getDate() - 1);
            endDate = endDateObj;
        }
    } else {
        // Pour les mises à jour sans inclusiveEndDate explicite
        if (taskData.end_date) {
            endDate = taskData.end_date;
        } else if (taskData.end) {
            const endDateObj = new Date(taskData.end);
            endDateObj.setDate(endDateObj.getDate() - 1);
            endDate = endDateObj;
        }
    }
    
    // Convertir en format ISO si nécessaire
    if (endDate instanceof Date) {
        endDate = endDate.toISOString().split('T')[0];
    }

    return {
        title: taskData.title.trim(),
        startDate: startDate,
        endDate: endDate,
        description: taskData.description?.trim() || '',
        ownerId: taskData.resourceId ? parseInt(taskData.resourceId, 10) : null,
        statusId: statusId
    };
};

const transformServerResponseToTask = (serverResponse) => {
    if (!serverResponse || typeof serverResponse !== 'object') {
        console.warn('Données invalides reçues pour transformation de tâche');
        return null;
    }

    const normalizeDate = (dateString) => {
        if (!dateString) return null;
        try {
            // Convertir en date UTC à minuit
            const date = new Date(dateString);
            const normalizedDate = new Date(
                Date.UTC(
                    date.getFullYear(), 
                    date.getMonth(), 
                    date.getDate()
                )
            );
            
            return normalizedDate.toISOString().split('T')[0];
        } catch (error) {
            console.warn('Erreur de conversion de date:', error);
            return null;
        }
    };

    // Normaliser les dates inclusives du serveur
    const inclusiveStartDate = normalizeDate(serverResponse.start_date);
    const inclusiveEndDate = normalizeDate(serverResponse.end_date);
    
    // Calculer la date de fin exclusive pour FullCalendar
    let exclusiveEndDate = null;
    if (inclusiveEndDate) {
        const endDate = new Date(inclusiveEndDate);
        endDate.setDate(endDate.getDate() + 1);
        exclusiveEndDate = endDate.toISOString().split('T')[0];
    }

    return {
        id: serverResponse.id || null,
        title: serverResponse.title?.trim() || 'Tâche sans titre',
        start: inclusiveStartDate,
        end: exclusiveEndDate,
        start_date: inclusiveStartDate,
        end_date: inclusiveEndDate,
        exclusiveEndDate: exclusiveEndDate,
        owner_id: serverResponse.owner_id || serverResponse.ownerId || null,
        allDay: true,
        extendedProps: {
            statusId: serverResponse.status_id 
                || serverResponse.statusId 
                ? String(serverResponse.status_id || serverResponse.statusId) 
                : null,
            userId: serverResponse.user_id || serverResponse.userId || null,
            description: serverResponse.description?.trim() || '',
            ownerName: serverResponse.owner_name || null,
            statusType: serverResponse.status_type || null,
            teamName: serverResponse.team_name || null,
            inclusiveEndDate: inclusiveEndDate
        }
    };
};


const validateTaskData = (taskData) => {
    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
    
    // Validation des dates avec gestion des formats ISO
    // Si nous avons une exclusiveEndDate, nous l'utiliserons pour la validation
    let startDate = taskData.startDate || taskData.start;
    let endDate;
    
    if (taskData.exclusiveEndDate) {
        // Si nous avons une exclusiveEndDate, nous l'utilisons telle quelle pour la validation
        endDate = taskData.exclusiveEndDate;
    } else {
        // Sinon, nous utilisons la date de fin traditionnelle
        endDate = taskData.endDate || taskData.end;
    }
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error(ERROR_MESSAGES.INVALID_DATE_FORMAT);
        }
        
        if (end < start) {
            throw new Error(ERROR_MESSAGES.END_DATE_AFTER_START);
        }
    }
};

export const fetchTasks = async () => {
    try {
        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            headers: getAuthHeaders()
        });

        const dataFromServer = await handleResponse(response);
        const transformedTasks = dataFromServer.map(transformServerResponseToTask);
        return transformedTasks;
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

        const dataFromServer = await handleResponse(response);
        // Transforme et retourne un tableau, même pour une création unique
        const transformedTasks = [transformServerResponseToTask(dataFromServer)]
            .filter(task => task !== null);
        return transformedTasks[0] || null;
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

        const dataFromServer = await handleResponse(response);

        // Transforme et retourne un tableau, même pour une mise à jour unique
        const transformedTasks = [transformServerResponseToTask(dataFromServer)]
            .filter(task => task !== null);

        return transformedTasks[0] || null;
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