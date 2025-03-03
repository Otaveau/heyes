import { updateTask as updateTaskService, createTask } from '../services/api/taskService';
import { toast } from 'react-toastify';
import { TOAST_CONFIG, ERROR_MESSAGES } from '../constants/constants';
import { DateUtils } from '../utils/dateUtils';

export const useTaskOperations = (setTasks, setExternalTasks) => {


  const transformTaskForServer = (taskData) => {

    let startDate = new Date(taskData.start);
    let endDate = new Date(taskData.end || taskData.start);

    const formattedStartDate = DateUtils.prepareDateForServer(startDate);
    const formattedEndDate = DateUtils.prepareDateForServer(endDate);

    return {
      title: taskData.title.trim(),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      description: taskData.description?.trim() || '',
      ownerId: taskData.resourceId ? parseInt(taskData.resourceId, 10) : null,
      statusId: taskData.statusId ? parseInt(taskData.statusId, 10) : null
    };
  };

  const transformServerResponseToTask = (serverResponse) => {

    const startDate = DateUtils.adjustDateFromServer(serverResponse.start_date);
    const endDate = DateUtils.adjustDateFromServer(serverResponse.end_date);

    return {
      id: serverResponse.id,
      title: serverResponse.title,
      start: startDate,
      end: endDate,
      resourceId: (serverResponse.owner_id || serverResponse.ownerId)?.toString(),
      allDay: true,
      extendedProps: {
        statusId: (serverResponse.status_id || serverResponse.statusId)?.toString(),
        userId: serverResponse.user_id || serverResponse.userId,
        description: serverResponse.description || ''
      }
    };
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const serverData = transformTaskForServer(taskData);
      const response = await updateTaskService(taskId, serverData);
      return transformServerResponseToTask(response);
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR;
      toast.error(errorMessage, TOAST_CONFIG);
      throw error;
    }
  };

  const createNewTask = async (taskData) => {
    try {
      const serverData = transformTaskForServer(taskData);
      const response = await createTask(serverData);
      return transformServerResponseToTask(response);
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR;
      toast.error(errorMessage, TOAST_CONFIG);
      throw error;
    }
  };


  const handleTaskError = (error, message, revertFunction) => {
    console.error('Task operation error:', error);
    const errorMessage = message || error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR;
    toast.error(errorMessage, TOAST_CONFIG);
    if (revertFunction) revertFunction();
  };


  return {
    updateTask,
    createNewTask,
    handleTaskError
  };
};
