import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import { createCalendarOptions } from './CalendarConfig';
import { useCalendarData } from '../../hooks/useCalendarData';
import { TaskForm } from '../Tasks/TaskForm';
import { BacklogTaskList } from '../Backlogs/BacklogTaskList';
import { updateTask, createTask, updateTaskStatus } from '../../services/apiService';
import '../../style/CalendarView.css';

const CalendarView = () => {
  const [showWeekends, setShowWeekends] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const { tasks, setTasks, resources, holidays, statuses } = useCalendarData();

  const getStatusIdByType = (type) => {
    if (!type || !statuses || statuses.length === 0) {
      return null; // ou une valeur par défaut appropriée
    }
    
    const status = statuses.find(s => 
      s.status_type && s.status_type.toLowerCase() === type.toLowerCase()
    );
    
    return status?.status_id;
  };

  const handleTaskClick = (task) => {
    setSelectedTask({
      id: task.id,
      title: task.title,
      description: task.description,
      start: task.start,
      end: task.end,
      resourceId: task.resourceId,
      status_id: task.status_id  // Changé status en status_id
    });
    setIsFormOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const task = tasks.find(t => t.id === parseInt(clickInfo.event.id));
    if (task) {
      handleTaskClick(task);
    }
  };

  const handleEventResize = async (info) => {
    try {
      const updatedData = {
        startDate: info.event.start,
        endDate: info.event.end
      };
      await updateTask(info.event.id, updatedData);
      setTasks(tasks.map(task =>
        task.id === info.event.id
          ? { ...task, start: info.event.start, end: info.event.end }
          : task
      ));
    } catch (error) {
      info.revert();
    }
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end,
      resourceId: selectInfo.resource?.id
    });
    setIsFormOpen(true);
  };

  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    const resourceId = event.getResources()[0]?.id;

    try {
      console.log('Drop event:', {
        event,
        eventProps: event.extendedProps,
        resourceId
      });

      // Si l'événement vient d'un backlog
      if (event.extendedProps.source === 'backlog') {
        const wipStatusId = getStatusIdByType('wip');

        // Créer une nouvelle tâche avec le statut WIP
        const newTaskData = {
          title: event.title,
          description: event.extendedProps.description,
          startDate: event.start,
          endDate: event.end || new Date(event.start.getTime() + 24 * 60 * 60 * 1000), // +1 jour si pas de date de fin
          ownerId: resourceId,
          status_id: wipStatusId
        };

        console.log('Creating new task:', newTaskData);

        // Créer la nouvelle tâche
        const newTask = await createTask(newTaskData);

        // Ajouter la nouvelle tâche à l'état local
        setTasks(prevTasks => [...prevTasks, {
          id: newTask.id,
          title: newTask.title,
          start: newTask.start_date,
          end: newTask.end_date,
          resourceId: newTask.owner_id,
          description: newTask.description,
          status_id: wipStatusId
        }]);

      } else {
        // Comportement normal pour les tâches déjà dans le calendrier
        const updatedData = {
          startDate: event.start,
          endDate: event.end || event.start,
          ownerId: resourceId,
          title: event.title
        };

        await updateTask(event.id, updatedData);
        setTasks(tasks.map(task =>
          task.id === event.id
            ? {
              ...task,
              start: event.start,
              end: event.end || event.start,
              resourceId
            }
            : task
        ));
      }
    } catch (error) {
      console.error('Drop error:', error);
      dropInfo.revert();
    }
  };

  const handleSubmit = async (formData, taskId) => {
    try {
      if (taskId) {
        // Mode modification
        const updatedData = {
          title: formData.title,
          description: formData.description,
          owner_id: formData.resourceId,
          start_date: formData.startDate,
          end_date: formData.endDate,
          status_id: formData.status_id  // Changé status en status_id
        };

        await updateTask(taskId, updatedData);
        setTasks(tasks.map(task =>
          task.id === taskId
            ? {
              ...task,
              title: formData.title,
              start: formData.startDate,
              end: formData.endDate,
              resourceId: formData.resourceId,
              status_id: formData.status_id  // Changé status en status_id
            }
            : task
        ));
      } else {
        // Mode création
        const entrantStatusId = getStatusIdByType('entrant'); // Obtenir l'ID du status entrant
        const response = await createTask({
          ...formData,
          status_id: entrantStatusId  // Utiliser status_id avec l'ID correct
        });

        setTasks([...tasks, {
          id: response.id,
          title: formData.title,
          start: formData.startDate,
          end: formData.endDate,
          resourceId: formData.resourceId,
          status_id: entrantStatusId  // Utiliser status_id
        }]);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleStatusUpdate = async (taskId, statusId) => {
    try {
      console.log('Updating task status:', { taskId, status_id: statusId });
      const updatedTask = await updateTaskStatus(taskId, statusId);

      setTasks(currentTasks => currentTasks.map(task =>
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
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const calendarOptions = createCalendarOptions({
    resources,
    tasks,
    showWeekends,
    setShowWeekends,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop
  });

  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex flex-col relative">
        <div className="flex-1 p-4">
          <FullCalendar {...calendarOptions} />
        </div>

        <TaskForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedTask(null);
          }}
          selectedDates={selectedDates}
          selectedTask={selectedTask}
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