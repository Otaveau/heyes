import { toast } from 'react-toastify';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { DateUtils } from './dateUtils';

export class TaskUtils {
    static validateWorkingDates(startDate, endDate, holidays) {
        const start = DateUtils.normalize(startDate);
        const end = DateUtils.normalize(endDate);
    
        if (!start || !end) {
          toast.error(ERROR_MESSAGES.INVALID_DATE);
          return false;
        }
    
        if (!DateUtils.validateDateRange(start, end, holidays)) {
          toast.error('La tâche ne peut pas commencer ou se terminer sur un week-end ou un jour férié');
          return false;
        }
    
        return true;
      }

  static prepareTaskUpdate(taskData, resourceId = null, statusId = null) {
    return {
      ...taskData,
      start: DateUtils.formatUTCDate(taskData.start),
      end: DateUtils.formatUTCDate(taskData.end),
      resourceId: resourceId ? parseInt(resourceId, 10) : null,
      statusId: statusId || taskData.statusId,
      source: 'calendar',
      isCalendarTask: true
    };
  }

  static handleTaskError(error, errorMessage, revertFn = null) {
    console.error('Erreur:', error);
    toast.error(errorMessage, TOAST_CONFIG);
    if (revertFn) revertFn();
  }

  static updateTaskState(taskId, updates, setTasks) {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }
}

// Pour maintenir la compatibilité avec le code existant, on peut exporter aussi les fonctions individuelles
export const validateWorkingDates = TaskUtils.validateWorkingDates.bind(TaskUtils);
export const prepareTaskUpdate = TaskUtils.prepareTaskUpdate.bind(TaskUtils);
export const handleTaskError = TaskUtils.handleTaskError.bind(TaskUtils);
export const updateTaskState = TaskUtils.updateTaskState.bind(TaskUtils);


