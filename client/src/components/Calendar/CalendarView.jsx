import React, { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import { createCalendarOptions } from './CalendarConfig';
import { useCalendarData } from '../../hooks/useCalendarData';
import { TaskForm } from '../Tasks/TaskForm';
import { BacklogTaskList } from '../Backlogs/BacklogTaskList';
import { updateTask, createTask, updateTaskStatus } from '../../services/apiService';
import { getStatusId } from '../../utils/taskFormatters';
import { formatUTCDate } from '../../utils/dateUtils';
import { DEFAULT_TASK_DURATION, STATUS_TYPES } from '../../constants/constants';
import { toast } from 'react-toastify';
import '../../style/CalendarView.css';

const CalendarView = () => {
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null
  });

  const { tasks, setTasks, resources, holidays, statuses } = useCalendarData();

  const formatTaskResponse = useCallback((task, statusId) => ({
    id: task.id,
    title: task.title,
    start: task.start_date,
    end: task.end_date,
    description: task.description,
    resourceId: task.ownerId,
    statusId: statusId
  }), []);

  const handleTaskClick = useCallback((task) => {
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
    }
  }, [tasks, handleTaskClick]);

  const handleEventResize = useCallback(async (info) => {
    try {
      const updatedData = {
        startDate: info.event.start,
        endDate: info.event.end
      };
      await updateTask(info.event.id, updatedData);

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === info.event.id
          ? { ...task, start: info.event.start, end: info.event.end }
          : task
      ));
      toast.success(`Tâche "${info.event.title}" redimensionnée avec succès`);
    } catch (error) {
      console.error('Error resizing task:', error);
      toast.error('Erreur lors du redimensionnement de la tâche');
      info.revert();
    }
  }, [setTasks]);

  const handleDateSelect = useCallback((selectInfo) => {
    setCalendarState(prev => ({
      ...prev,
      selectedDates: {
        start: selectInfo.start,
        end: selectInfo.end,
        resourceId: selectInfo.resource?.id
      },
      isFormOpen: true
    }));
  }, []);

  const handleBacklogDrop = useCallback(async (event, resourceId) => {
    const wipStatusId = getStatusId(STATUS_TYPES.WIP);

    // Formatage des dates
    const startDate = formatUTCDate(event.start.toISOString());
    const endDate = event.end
      ? formatUTCDate(event.end.toISOString())
      : formatUTCDate(new Date(event.start.getTime() + DEFAULT_TASK_DURATION).toISOString());

    const newTaskData = {
      title: event.title,
      startDate,
      endDate,
      description: event.extendedProps.description,
      ownerId: resourceId,
      statusId: wipStatusId
    };

    const newTask = await createTask(newTaskData);
    setTasks(prevTasks => [...prevTasks, formatTaskResponse(newTask, wipStatusId)]);
    toast.success(`Tâche "${event.title}" créée depuis le backlog`);
  }, [setTasks, formatTaskResponse]);

  const handleCalendarDrop = useCallback(async (event,  resourceId, statusId) => {
    // Formatage des dates
    const startDate = formatUTCDate(event.start.toISOString());
    const endDate = event.end
      ? formatUTCDate(event.end.toISOString())
      : startDate;
    const description = event.extendedProps?.description || '';

    // Conversion explicite de resourceId et statusId en nombres
    const updatedData = {
      startDate,
      endDate,
      description,
      ownerId: resourceId,
      title: event.title,
      statusId: statusId
    };

    console.log('handleCalendarDrop updatedData:', updatedData);

    try {
      await updateTask(event.id, updatedData);
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === event.id
          ? {
            ...task,
            start: startDate,
            end: endDate,
            description,
            resourceId: parseInt(resourceId, 10),
            statusId: parseInt(statusId, 10)
          }
          : task
      ));
      toast.success(`Tâche "${event.title}" déplacée avec succès`);
    } catch (error) {
      console.error('Drop error details:', error);
      throw error;
    }
  }, [setTasks]);

  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    console.log('Event drop info:', {
      event: event,
      start: event.start,
      end: event.end,
      rawStart: event.start?.toISOString(),
      rawEnd: event.end?.toISOString()
    });

    const resourceId = event.getResources()[0]?.id;
    const statusId = event.extendedProps.statusId;

    // S'assurer que event.start existe
    if (!event.start) {
      console.error('No start date provided');
      toast.error(`Date de début manquante pour la tâche "${event.title}"`);
      dropInfo.revert();
      return;
    }

    console.log('Dates avant formatage:', {
      start: event.start,
      end: event.end
    });

    // Formatage des dates avec des vérifications supplémentaires
    const startDate = formatUTCDate(event.start.toISOString());
    const endDate = event.end
      ? formatUTCDate(event.end.toISOString())
      : startDate; // Utiliser la date de début si pas de fin

    console.log('Dates après formatage:', {
      startDate,
      endDate
    });


    // Vérification explicite des dates
    if (!startDate) {
      console.error('Start date is null after formatting');
      toast.error(`Erreur de format de date pour la tâche "${event.title}"`);
      dropInfo.revert();
      return;
    }

    const updatedData = {
      title: event.title,
      startDate: startDate,
      endDate: endDate || startDate, // Fallback supplémentaire
      ownerId: resourceId || event.extendedProps.owner_id,
      statusId: statusId
    };

    console.log('Updated data before API call:', updatedData);

    try {
      if (event.extendedProps.source === 'backlog') {
        await handleBacklogDrop(event, updatedData);
      } else {
        await handleCalendarDrop(event, updatedData);
      }
    } catch (error) {
      console.error('Drop error details:', {
        error,
        eventData: event,
        updatedData
      });
      toast.error(`Erreur lors du déplacement de la tâche "${event.title}"`);
      dropInfo.revert();
    }
  }, [handleBacklogDrop, handleCalendarDrop]);


  const handleTaskUpdate = useCallback(async (formData, taskId) => {
    const updatedData = {
      title: formData.title,
      description: formData.description,
      ownerId: formData.resourceId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      statusId: formData.statusId
    };

    await updateTask(taskId, updatedData);

    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId
        ? {
          ...task,
          title: formData.title,
          start: formData.startDate,
          end: formData.endDate,
          resourceId: formData.resourceId,
          statusId: formData.statusId
        }
        : task
    ));
    toast.success(`Tâche "${formData.title}" mise à jour avec succès`);
  }, [setTasks]);

  const handleTaskCreate = useCallback(async (formData) => {

    console.log('handleTaskCreate formData :', formData);
    const response = await createTask({
      ...formData,

    });

    setTasks(prevTasks => [...prevTasks, formatTaskResponse(response)]);
    toast.success(`Nouvelle tâche "${formData.title}" créée`);
  }, [setTasks, formatTaskResponse]);

  const handleSubmit = useCallback(async (formData, taskId) => {

    console.log('handleSubmit formData :', formData);
    console.log('handleSubmit taskId :', taskId);

    try {
      if (taskId) {
        await handleTaskUpdate(formData, taskId);
      } else {
        await handleTaskCreate(formData);
      }
      setCalendarState(prev => ({ ...prev, isFormOpen: false, selectedTask: null }));
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Erreur lors de la sauvegarde de la tâche');
    }
  }, [handleTaskUpdate, handleTaskCreate]);

  const handleStatusUpdate = useCallback(async (taskId, statusId) => {
    try {
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
      if (existingTask) {
        toast.success(`Statut de la tâche "${existingTask.title}" mis à jour`);
      } else {
        toast.success('Statut de la tâche mis à jour');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  }, [setTasks, tasks]);

  const handleFormClose = useCallback(() => {
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: false,
      selectedTask: null
    }));
  }, []);

  const calendarOptions = useMemo(() => createCalendarOptions({
    resources,
    tasks,
    showWeekends: calendarState.showWeekends,
    setShowWeekends: (value) => setCalendarState(prev => ({ ...prev, showWeekends: value })),
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop
  }), [
    resources,
    tasks,
    calendarState.showWeekends,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop
  ]);

  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex flex-col relative">
        <div className="flex-1 p-4">
          <FullCalendar {...calendarOptions} />
        </div>

        <TaskForm
          isOpen={calendarState.isFormOpen}
          onClose={handleFormClose}
          selectedDates={calendarState.selectedDates}
          selectedTask={calendarState.selectedTask}
          resources={resources}
          statuses={statuses}
          onSubmit={handleSubmit}
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