import React, { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import { AlertCircle } from 'lucide-react';
import { createCalendarOptions } from './CalendarConfig';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { TaskForm } from '../Tasks/TaskForm';
import { BacklogTaskList } from '../Backlogs/BacklogTaskList';
import { updateTask, createTask, updateTaskStatus } from '../../services/api/taskService';
import { DEFAULT_TASK_DURATION, TOAST_CONFIG } from '../../constants/constants';
import { toast } from 'react-toastify';
import '../../style/CalendarView.css';

export const CalendarView = () => {
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false
  });

  const { tasks, setTasks, resources, holidays, statuses, error: dataError } = useCalendarData();

  const {
    handleTaskClick,
    handleEventClick,
    handleEventResize,
    handleEventDrop,
    handleDrop, 
    handleEventReceive
  } = useTaskHandlers(setTasks, setCalendarState, statuses, tasks);

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
        ownerId: formData.resourceId ? parseInt(formData.resourceId, 10) : null,
        statusId: formData.statusId ? parseInt(formData.statusId, 10) : null,
      };

      const result = taskId
        ? await updateTask(taskId, sanitizedFormData)
        : await createTask(sanitizedFormData);

      const formattedTask = {
        id: result.id || taskId,
        title: result.title || sanitizedFormData.title,
        start: new Date(result.start_date || result.startDate),
        end: new Date(result.end_date || result.endDate),
        description: result.description || sanitizedFormData.description,
        resourceId: result.owner_id || result.ownerId || sanitizedFormData.ownerId,
        statusId: result.status_id || result.statusId || sanitizedFormData.statusId
      };

      setTasks(prevTasks => {
        const otherTasks = taskId
          ? prevTasks.filter(task => task.id !== taskId)
          : prevTasks;

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
      toast.error('Erreur lors de la sauvegarde', TOAST_CONFIG);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setTasks]);

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
    setTasks,
    statuses,
    showWeekends: calendarState.showWeekends,
    setShowWeekends: (value) => setCalendarState(prev => ({
      ...prev,
      showWeekends: value
    })),
    holidays,
    handleDateSelect,
    handleEventResize: (info) => handleEventResize(info, calendarState.isProcessing),
    handleEventClick: (clickInfo) => handleEventClick(clickInfo),
    handleEventDrop: (dropInfo) => handleEventDrop(dropInfo, calendarState.isProcessing, statuses, tasks, setTasks),
    handleDrop,
    handleEventReceive,
    isProcessing: calendarState.isProcessing
  }), [
    resources,
    tasks,
    setTasks,
    statuses,
    calendarState.showWeekends,
    calendarState.isProcessing,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop,
    handleDrop,
    handleEventReceive,
    
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
          className="mt-4"
        />
      </div>
    </div>
  );
};