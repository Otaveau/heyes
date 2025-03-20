import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';
import { ERROR_MESSAGES } from '../../constants/constants';


const transformTaskForServer = (taskData) => {
    const statusId = taskData.statusId || taskData.extendedProps?.statusId;
    
    // Capture des dates sous leurs formes originales
    let startDate = taskData.start || taskData.startDate;
    let endDate = taskData.end || taskData.endDate;
    
    console.log("Dates originales reçues par transformTaskForServer:", {
        start: startDate,
        end: endDate
    });
    
    // Fonction de conversion de date précise
    const formatExactDate = (dateString) => {
        if (!dateString) return null;
        
        // Créer une date en s'assurant de ne pas modifier le jour
        const date = new Date(dateString);
        
        // Méthode alternative pour formater la date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    };

    const formattedStartDate = formatExactDate(startDate);
    const formattedEndDate = formatExactDate(endDate);
    
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
    if (!serverResponse || typeof serverResponse !== 'object') {
        console.warn('Données invalides reçues pour transformation de tâche');
        return null;
    }

    const normalizeDate = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            
            // Méthode alternative de formatage de date
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.warn('Erreur de conversion de date:', error);
            return null;
        }
    };

    return {
        id: serverResponse.id || null,
        title: serverResponse.title?.trim() || 'Tâche sans titre',
        start_date: normalizeDate(serverResponse.start_date),
        end_date: normalizeDate(serverResponse.end_date),
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
            teamName: serverResponse.team_name || null
        }
    };
};


const validateTaskData = (taskData) => {
    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
    
    // Validation des dates avec gestion des formats ISO
    if (taskData.startDate && taskData.endDate) {
        const start = new Date(taskData.startDate);
        const end = new Date(taskData.endDate);
        
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

        console.log('Données reçues du serveur:', dataFromServer);

        // Transformer le tableau complet au lieu d'un seul objet
        const transformedTasks = dataFromServer.map(transformServerResponseToTask);

        console.log('Données transformées du serveur:', transformedTasks);

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

        console.log('Données transformées du serveur:', transformedTasks);

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