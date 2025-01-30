import React, { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import { createCalendarOptions } from './CalendarConfig';
import { useCalendarData } from '../../hooks/useCalendarData';
import { TaskForm } from '../Tasks/TaskForm';
import { BacklogTaskList } from '../Backlogs/BacklogTaskList';
import { updateTask, createTask, updateTaskStatus } from '../../services/apiService';
import { getStatusId } from '../../utils/taskFormatters';
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
    resourceId: task.owner_id,
    description: task.description,
    status_id: statusId
  }), []);

  const handleTaskClick = useCallback((task) => {
    setCalendarState(prev => ({
      ...prev,
      selectedTask: {
        id: task.id,
        title: task.title,
        description: task.description,
        start: task.start,
        end: task.end,
        resourceId: task.resourceId,
        status_id: task.status_id
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
    const newTaskData = {
      title: event.title,
      description: event.extendedProps.description,
      startDate: event.start,
      endDate: event.end || new Date(event.start.getTime() + DEFAULT_TASK_DURATION),
      ownerId: resourceId,
      status_id: wipStatusId
    };

    const newTask = await createTask(newTaskData);
    setTasks(prevTasks => [...prevTasks, formatTaskResponse(newTask, wipStatusId)]);
    toast.success(`Tâche "${event.title}" créée depuis le backlog`);
  }, [setTasks, formatTaskResponse]);

  const handleCalendarDrop = useCallback(async (event, resourceId) => {
    const updatedData = {
      startDate: event.start,
      endDate: event.end || event.start,
      ownerId: resourceId,
      title: event.title
    };

    await updateTask(event.id, updatedData);
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === event.id
        ? {
          ...task,
          start: event.start,
          end: event.end || event.start,
          resourceId
        }
        : task
    ));
    toast.success(`Tâche "${event.title}" déplacée avec succès`);
  }, [setTasks]);

  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const resourceId = event.getResources()[0]?.id;

    try {
      if (event.extendedProps.source === 'backlog') {
        await handleBacklogDrop(event, resourceId);
      } else {
        await handleCalendarDrop(event, resourceId);
      }
    } catch (error) {
      console.error('Drop error:', error);
      toast.error(`Erreur lors du déplacement de la tâche "${event.title}"`);
      dropInfo.revert();
    }
  }, [handleBacklogDrop, handleCalendarDrop]);

  const handleTaskUpdate = useCallback(async (formData, taskId) => {
    const updatedData = {
      title: formData.title,
      description: formData.description,
      owner_id: formData.resourceId,
      start_date: formData.startDate,
      end_date: formData.endDate,
      status_id: formData.status_id
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
          status_id: formData.status_id
        }
        : task
    ));
    toast.success(`Tâche "${formData.title}" mise à jour avec succès`);
  }, [setTasks]);

  const handleTaskCreate = useCallback(async (formData) => {
    const entrantStatusId = getStatusId(STATUS_TYPES.ENTRANT);
    const response = await createTask({
      ...formData,
      status_id: entrantStatusId
    });

    setTasks(prevTasks => [...prevTasks, formatTaskResponse(response, entrantStatusId)]);
    toast.success(`Nouvelle tâche "${formData.title}" créée`);
  }, [setTasks, formatTaskResponse]);

  const handleSubmit = useCallback(async (formData, taskId) => {
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
            status_id: statusId,
            owner_id: updatedTask.owner_id,
            start_date: updatedTask.start_date,
            end_date: updatedTask.end_date
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