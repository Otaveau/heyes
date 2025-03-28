import { useCallback } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { createTask, updateTask, deleteTask } from '../services/api/taskService';
import { DateUtils } from '../utils/dateUtils';

export const useTaskMutationHandlers = (setTasks, setCalendarState, tasks, holidays) => {
  // Fonction utilitaire pour convertir une date inclusive en date exclusive
  const getExclusiveEndDate = useCallback((inclusiveDate) => {
    if (!inclusiveDate) return null;

    const date = new Date(inclusiveDate);
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  // Mise à jour du statut d'une tâche (sans appel API)
  const updateTaskStatus = useCallback((taskId, updates) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id.toString() === taskId.toString()
          ? { ...task, ...updates }
          : task
      )
    );
  }, [setTasks]);

  // Mise à jour d'une tâche avec appel API
  // Modification de handleTaskUpdate dans useTaskMutationHandlers.js
  // Cette modification garantit que handleTaskUpdate respecte les dates null

  const handleTaskUpdate = useCallback(async (taskId, updates, options = {}) => {
    const { revertFunction = null, successMessage = null, skipApiCall = false } = options;
    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const existingTask = tasks.find(task => task.id.toString() === taskId.toString());

      // Modification importante: vérifier si les dates doivent être nulles
      const isRemovingDates = updates.start === null && updates.end === null;

      // Préparer les mises à jour avec gestion des dates
      let completeUpdates = {
        ...updates,
        title: updates.title || existingTask.title
      };

      // Seulement convertir les dates si nous ne sommes pas en train de les supprimer
      if (!isRemovingDates && updates.extendedProps?.inclusiveEndDate && !updates.end) {
        // Convertir la date inclusive en date exclusive pour FullCalendar
        const exclusiveEndDate = getExclusiveEndDate(updates.extendedProps.inclusiveEndDate);

        completeUpdates = {
          ...completeUpdates,
          end: exclusiveEndDate, // Date exclusive pour FullCalendar
          exclusiveEndDate: exclusiveEndDate // Stockage explicite de la date exclusive
        };
      }

      // Si les dates doivent être nulles, s'assurer qu'elles le sont partout
      if (isRemovingDates) {
        completeUpdates = {
          ...completeUpdates,
          start: null,
          end: null,
          start_date: null,
          end_date: null,
          startDate: null,
          endDate: null,
          exclusiveEndDate: null,
          // S'assurer que extendedProps existe et contient aussi des dates nulles
          extendedProps: {
            ...(completeUpdates.extendedProps || {}),
            inclusiveEndDate: null,
            exclusiveEndDate: null,
            start: null,
            end: null,
            start_date: null,
            end_date: null
          }
        };
      }

      // Mise à jour locale
      updateTaskStatus(taskId, completeUpdates);

      // Préparation des données pour l'API avec garantie que toutes les dates sont traitées correctement
      const apiUpdates = { ...completeUpdates };

      // Appel API si nécessaire
      let apiResponse = completeUpdates;
      if (!skipApiCall) {
        apiResponse = await updateTask(taskId, apiUpdates);
      }

      if (successMessage) {
        toast.success(successMessage, TOAST_CONFIG);
      }

      return apiResponse;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);

      if (revertFunction) {
        revertFunction();
      }
      return null;
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, updateTaskStatus, tasks, getExclusiveEndDate]);


  // Soumission du formulaire de tâche (création/modification)
  const handleTaskSubmit = useCallback(async (formData) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }

    const startDate = formData.startDate || formData.start;
    const inclusiveEndDate = formData.endDate || formData.end;

    console.log('formData', formData);


    // Validation des dates - utiliser la date inclusive pour validation
    if ((startDate && inclusiveEndDate) && !DateUtils.hasValidEventBoundaries(startDate, inclusiveEndDate, holidays)) {
      toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const taskData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        start: startDate,
        end: formData.extendedProps?.inclusiveEndDate, // Date exclusive pour FullCalendar
        exclusiveEndDate: formData.exclusiveEndDate,
        resourceId: formData.resourceId ? parseInt(formData.resourceId, 10) : null,
        statusId: formData.statusId,
        extendedProps: {
          ...(formData.extendedProps || {}),
          inclusiveEndDate: inclusiveEndDate, // Stocker la date inclusive dans extendedProps
          statusId: formData.statusId
        }
      };

      const taskId = formData.id;

      let updatedTask;
      // Cas de mise à jour d'une tâche existante
      if (taskId) {
        updateTaskStatus(taskId, taskData);
        updatedTask = await updateTask(taskId, taskData);
        toast.success('Tâche mise à jour', TOAST_CONFIG);
      }
      // Cas de création d'une nouvelle tâche
      else {
        updatedTask = await createTask(taskData);
        const newTask = {
          id: updatedTask.id,
          ...taskData,
          allDay: true
        };

        setTasks(prevTasks => [...prevTasks, newTask]);

        toast.success('Tâche créée', TOAST_CONFIG);
      }

      // Terminer et réinitialiser
      setCalendarState(prev => ({
        ...prev,
        isFormOpen: false,
        selectedTask: null,
      }));

      return updatedTask;
    } catch (error) {
      toast.error(formData.id ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED, TOAST_CONFIG);
      console.error('Erreur lors de la soumission de la tâche:', error);
      return null;
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [holidays, setCalendarState, updateTaskStatus, setTasks]);

  // Suppression d'une tâche
  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      setTasks(prevTasks => prevTasks.filter(task => task.id.toString() !== taskId.toString()));

      await deleteTask(taskId);

      toast.success('Tâche supprimée', TOAST_CONFIG);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(ERROR_MESSAGES.DELETE_FAILED, TOAST_CONFIG);
      return false;
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks]);

  return {
    updateTaskStatus,
    handleTaskUpdate,
    handleTaskSubmit,
    handleDeleteTask,
    getExclusiveEndDate
  };
};