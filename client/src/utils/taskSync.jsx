import { getStatusId } from './taskFormatters';
import { STATUS_TYPES, ERROR_MESSAGES } from '../constants/constants';

export const syncTaskWithBacklog = (task, sourceType, statusList) => {
    if (!task || !sourceType) {
        console.error(ERROR_MESSAGES.INVALID_PARAMS, { task, sourceType });
        return null;
    }

    const {
        id,
        title = 'Sans titre',
        description = '',
        start,
        startDate,
        end,
        endDate,
        resourceId,
        status
    } = task;

    const baseTask = {
        id,
        title,
        description,
        startDate: start || startDate,
        endDate: end || endDate,
        resourceId,
        status
    };

    const wipStatusId = getStatusId(statusList, STATUS_TYPES.WIP);

    // Synchronisation de la tâche en fonction du type de source
    return {
        ...baseTask,
        status: wipStatusId,
        ...(sourceType === 'calendar' ? {} : { resourceId }) // Ajoute resourceId uniquement si ce n'est pas 'calendar'
    };
};
