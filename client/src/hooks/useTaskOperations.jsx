import { useCallback } from 'react';
import { updateTask as updateTaskService, createTask } from '../services/api/taskService';
import { toast } from 'react-toastify';
import { TOAST_CONFIG  } from '../constants/constants';

export const useTaskOperations = (setTasks, setExternalTasks) => {

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const updatedTask = await updateTaskService(taskId, updates);

      // Mettre à jour les tâches du calendrier
      setTasks(prevTasks => {
        const otherTasks = prevTasks.filter(task => task.id !== taskId);
        return updatedTask.resourceId ? [...otherTasks, updatedTask ] : otherTasks;
      });

      // Si nécessaire, mettre à jour les tâches externes
      if (!updatedTask.resourceId) {
        setExternalTasks(prevTasks => {
          const filteredTasks = prevTasks.filter(t => t.id !== taskId.toString());
          return [...filteredTasks, { ...updatedTask, id: taskId.toString() }];
        });
      } else {
        setExternalTasks(prevTasks => 
          prevTasks.filter(t => t.id !== taskId.toString())
        );
      }

      return updatedTask;
    } catch (error) {
      throw error;
    }
  }, [setTasks, setExternalTasks]);


  const createNewTask = useCallback(async (taskData) => {
    try {
      const result = await createTask(taskData);
      
      if (result.resourceId) {
        setTasks(prevTasks => [...prevTasks, result]);
      } else {
        setExternalTasks(prevTasks => [...prevTasks, result]);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }, [setTasks, setExternalTasks]);


  const handleTaskError = useCallback((error, errorMessage, revertFn = null) => {
    console.error('Erreur:', error);
    toast.error(errorMessage, TOAST_CONFIG);
    if (revertFn) revertFn();
  }, []);

  
  return {
    updateTask,
    createNewTask,
    handleTaskError
  };
};
