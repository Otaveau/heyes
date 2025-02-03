import React, { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import { AlertCircle } from 'lucide-react';
import { createCalendarOptions } from './CalendarConfig';
import { useCalendarData } from '../../hooks/useCalendarData';
import { TaskForm } from '../Tasks/TaskForm';
import { BacklogTaskList } from '../Backlogs/BacklogTaskList';
import { updateTask, createTask, updateTaskStatus } from '../../services/api/taskService';
import { getStatusId } from '../../utils/taskFormatters';
import { formatUTCDate } from '../../utils/dateUtils';
import { DEFAULT_TASK_DURATION, STATUS_TYPES } from '../../constants/constants';
import { toast } from 'react-toastify';
import '../../style/CalendarView.css';

const TOAST_CONFIG = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

const CalendarView = () => {
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false
  });

  const { tasks, setTasks, resources, holidays, statuses, error: dataError } = useCalendarData();

  const formatTaskResponse = useCallback((task, statusId) => {
    if (!task) return null;
    
    return {
      id: task.id,
      title: task.title || 'Sans titre',
      start: task.start_date,
      end: task.end_date,
      description: task.description || '',
      resourceId: task.ownerId,
      statusId: statusId
    };
  }, []);

  const handleTaskClick = useCallback((task) => {
    if (!task?.id) {
      console.warn('Tentative de click sur une tâche invalide');
      return;
    }

    setCalendarState(prev => ({
      ...prev,
      selectedTask: {
        id: task.id,
        title: task.title,
        start: task.start,
        end: task.end,
        description: task.description,
        resourceId: task.resourceId,
        statusId: task.statusId
      },
      isFormOpen: true
    }));
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    const task = tasks.find(t => t.id === parseInt(clickInfo.event.id));
    if (task) {
      handleTaskClick(task);
    } else {
      console.warn('Tâche non trouvée:', clickInfo.event.id);
    }
  }, [tasks, handleTaskClick]);

  const handleEventResize = useCallback(async (info) => {
    if (calendarState.isProcessing) {
      info.revert();
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const { event } = info;
      if (!event.start || !event.end) {
        throw new Error('Dates invalides');
      }

      const updatedData = {
        startDate: formatUTCDate(event.start),
        endDate: formatUTCDate(event.end)
      };

      await updateTask(event.id, updatedData);

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === event.id
          ? { ...task, start: event.start, end: event.end }
          : task
      ));

      toast.success(`Tâche "${event.title}" redimensionnée`, TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur de redimensionnement:', error);
      toast.error('Erreur lors du redimensionnement', TOAST_CONFIG);
      info.revert();
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setTasks, calendarState.isProcessing]);

  const handleDateSelect = useCallback((selectInfo) => {
    if (!selectInfo.start) return;

    setCalendarState(prev => ({
      ...prev,
      selectedDates: {
        start: selectInfo.start,
        end: selectInfo.end || new Date(selectInfo.start.getTime() + DEFAULT_TASK_DURATION),
        resourceId: selectInfo.resource?.id
      },
      isFormOpen: true
    }));
  }, []);

  const handleBacklogDrop = useCallback(async (event, resourceId) => {
    if (!event?.title || !resourceId) {
      throw new Error('Données de tâche invalides');
    }

    const wipStatusId = getStatusId(STATUS_TYPES.WIP);
    const startDate = formatUTCDate(event.start.toISOString());
    const endDate = event.end
      ? formatUTCDate(event.end.toISOString())
      : formatUTCDate(new Date(event.start.getTime() + DEFAULT_TASK_DURATION).toISOString());

    const newTaskData = {
      title: event.title,
      startDate,
      endDate,
      description: event.extendedProps?.description || '',
      ownerId: resourceId,
      statusId: wipStatusId
    };

    const newTask = await createTask(newTaskData);
    const formattedTask = formatTaskResponse(newTask, wipStatusId);
    
    if (formattedTask) {
      setTasks(prevTasks => [...prevTasks, formattedTask]);
      toast.success(`Tâche "${event.title}" créée`, TOAST_CONFIG);
    }
  }, [setTasks, formatTaskResponse]);

  const handleCalendarDrop = useCallback(async (event, resourceId, statusId) => {
    if (!event?.start) {
      throw new Error('Date de début manquante');
    }

    const startDate = formatUTCDate(event.start.toISOString());
    const endDate = event.end
      ? formatUTCDate(event.end.toISOString())
      : startDate;

    const updatedData = {
      startDate,
      endDate,
      description: event.extendedProps?.description || '',
      ownerId: parseInt(resourceId, 10),
      title: event.title,
      statusId: parseInt(statusId, 10)
    };

    await updateTask(event.id, updatedData);
    
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === event.id
        ? {
          ...task,
          start: startDate,
          end: endDate,
          description: updatedData.description,
          resourceId: updatedData.ownerId,
          statusId: updatedData.statusId
        }
        : task
    ));
  }, [setTasks]);

  const handleEventDrop = useCallback(async (dropInfo) => {
    if (calendarState.isProcessing) {
      dropInfo.revert();
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const { event } = dropInfo;
      if (!event?.start) {
        throw new Error('Date de début manquante');
      }

      const resourceId = event.getResources()[0]?.id;
      const statusId = event.extendedProps?.statusId;

      if (event.extendedProps?.source === 'backlog') {
        await handleBacklogDrop(event, resourceId);
      } else {
        await handleCalendarDrop(event, resourceId, statusId);
      }

      toast.success(`Tâche "${event.title}" déplacée`, TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur de déplacement:', error);
      toast.error('Erreur lors du déplacement', TOAST_CONFIG);
      dropInfo.revert();
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [handleBacklogDrop, handleCalendarDrop, calendarState.isProcessing]);

  const handleSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error('Le titre est requis', TOAST_CONFIG);
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const sanitizedFormData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        ownerId: formData.resourceId,
        statusId: formData.statusId,
      };

      const result = taskId
        ? await updateTask(sanitizedFormData, taskId)
        : await createTask(sanitizedFormData);

      const formattedTask = formatTaskResponse(result, result.status_id);

      setTasks(prevTasks => {
        const otherTasks = taskId
          ? prevTasks.filter(task => task.id !== taskId)
          : prevTasks;

        if (result.status_id === 2 && result.owner_id) {
          return [
            ...otherTasks,
            formattedTask,
            {
              ...formattedTask,
              source: 'calendar',
              resourceId: result.owner_id
            }
          ];
        }

        return [...otherTasks, formattedTask];
      });

      setCalendarState(prev => ({ 
        ...prev, 
        isFormOpen: false, 
        selectedTask: null 
      }));

      toast.success(
        taskId ? 'Tâche mise à jour' : 'Tâche créée',
        TOAST_CONFIG
      );
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      toast.error(
        'Erreur lors de la sauvegarde',
        TOAST_CONFIG
      );
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [formatTaskResponse, setTasks]);

  const handleStatusUpdate = useCallback(async (taskId, statusId) => {
    if (!taskId || !statusId) return;

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const existingTask = tasks.find(t => t.id === taskId);
      const updatedTask = await updateTaskStatus(taskId, statusId);

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId
          ? {
            ...task,
            statusId: statusId,
            ownerId: updatedTask.owner_id,
            startDate: updatedTask.start_date,
            endDate: updatedTask.end_date
          }
          : task
      ));

      toast.success(
        `Statut ${existingTask ? `de "${existingTask.title}"` : ''} mis à jour`,
        TOAST_CONFIG
      );
    } catch (error) {
      console.error('Erreur de mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut', TOAST_CONFIG);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setTasks, tasks]);

  const calendarOptions = useMemo(() => createCalendarOptions({
    resources,
    tasks,
    showWeekends: calendarState.showWeekends,
    setShowWeekends: (value) => setCalendarState(prev => ({ 
      ...prev, 
      showWeekends: value 
    })),
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop,
    isProcessing: calendarState.isProcessing
  }), [
    resources,
    tasks,
    calendarState.showWeekends,
    calendarState.isProcessing,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop
  ]);

  if (dataError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        <span>Erreur de chargement des données: {dataError.message}</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-col">
        <div className="flex-1 p-4">
          <FullCalendar {...calendarOptions} />
        </div>

        <TaskForm
          isOpen={calendarState.isFormOpen}
          onClose={() => setCalendarState(prev => ({
            ...prev,
            isFormOpen: false,
            selectedTask: null
          }))}
          selectedDates={calendarState.selectedDates}
          selectedTask={calendarState.selectedTask}
          resources={resources}
          statuses={statuses}
          onSubmit={handleSubmit}
          isProcessing={calendarState.isProcessing}
        />

        <BacklogTaskList
          statuses={statuses}
          tasks={tasks}
          onStatusUpdate={handleStatusUpdate}
          resources={resources}
          onTaskClick={handleTaskClick}
        />
      </div>
    </div>
  );
};

export default CalendarView;