import {getStatusId} from './CalendarUtils';
import { STATUS_TYPES } from '../constants/constants';

export const syncTaskWithBacklog = (task, sourceType, statusList) => {
    if (!task || !sourceType) {
      console.error('Paramètres invalides pour syncTaskWithBacklog:', { task, sourceType });
      return null;
    }
  
    const baseTask = {
      id: task.id,
      title: task.title || 'Sans titre',
      description: task.description || '',
      startDate: task.start || task.startDate,
      endDate: task.end || task.endDate,
      resourceId: task.resourceId,
      status: task.status
    };
  
    const wipStatusId = getStatusId(statusList, STATUS_TYPES.WIP);
  
    if (sourceType === 'calendar') {
      return {
        ...baseTask,
        status: wipStatusId
      };
    }
  
    return {
      ...baseTask,
      resourceId: task.resourceId,
      status: wipStatusId
    };
  };