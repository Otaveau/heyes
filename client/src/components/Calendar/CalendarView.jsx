// CalendarView.jsx avec support d'affichage des tâches à la fois dans le calendrier et taskboard 2
import React, { useState, useRef, useMemo } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { CalendarMain } from '../calendar/CalendarMain';
import { TaskBoard } from '../tasks/TaskBoard';
import { TaskForm } from '../tasks/TaskForm';
import '../../style/CalendarView.css';

export const CalendarView = () => {
  // État principal du calendrier
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
    currentView: 'resourceTimelineYear',
    taskboardDestination: null,
    taskOriginId: null
  });

  // Année actuellement sélectionnée dans le calendrier
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Zones de dépôt pour le TaskBoard
  const dropZones = useMemo(() => [
    { id: 'todo', statusId: '1', title: 'À faire' },
    { id: 'inProgress', statusId: '2', title: 'En cours' },
    { id: 'blocked', statusId: '3', title: 'En attente' },
    { id: 'done', statusId: '4', title: 'Done' }
  ], []);

  // Créer les références pour les zones de dépôt
  const dropZoneRefs = useMemo(() => {
    return { current: dropZones.map(() => React.createRef()) };
  }, [dropZones]);

  const calendarRef = useRef(null);
  const { tasks, setTasks, resources, holidays, statuses } = useCalendarData();

  // Gérer la fermeture du formulaire
  const handleFormClose = () => {
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: false,
      selectedTask: null,
      selectedDates: null,
      taskboardDestination: null,
      taskOriginId: null
    }));
  };

  // Gérer la soumission du formulaire
  const handleFormSubmit = (updatedTask) => {
    // Si la tâche provient d'un déplacement vers le taskboard '2'
    if (calendarState.taskboardDestination === '2') {
      // S'assurer que le statusId est mis à jour correctement
      // Mais on conserve la tâche visible dans le taskboard 2
      updatedTask = {
        ...updatedTask,
        extendedProps: {
          ...updatedTask.extendedProps,
          statusId: '2' // Conserver le statusId '2' pour qu'elle reste visible dans le taskboard
        }
      };
      
      // Mettre à jour directement l'état des tâches
      const updatedTasks = tasks.map(task => {
        if (task.id.toString() === updatedTask.id.toString()) {
          return updatedTask;
        }
        return task;
      });
      
      setTasks(updatedTasks);
    } else {
      // Pour les autres cas, utiliser le gestionnaire normal
      if (taskHandlers && taskHandlers.handleTaskSubmit) {
        taskHandlers.handleTaskSubmit(updatedTask);
      }
    }
    
    // Réinitialiser l'état
    setCalendarState(prev => ({
      ...prev,
      taskboardDestination: null,
      taskOriginId: null,
      isFormOpen: false,
      selectedTask: null,
      selectedDates: null
    }));
  };

  // Hook pour gérer les interactions avec les tâches
  const taskHandlers = useTaskHandlers(
    setTasks,           
    setCalendarState,
    tasks,
    dropZoneRefs,
    dropZones,
    holidays,
    calendarRef
  );

  // Hook pour la navigation dans le calendrier
  const { 
    navigateToMonth, 
    goToPreviousYear, 
    goToNextYear, 
    handleViewChange,
    months
  } = useCalendarNavigation(calendarRef, selectedYear, setSelectedYear);

  return (
    <div className="flex flex-col dashboard">
      <div className="w-full calendar">
        <CalendarMain
          calendarRef={calendarRef}
          tasks={tasks}
          resources={resources}
          holidays={holidays}
          taskHandlers={taskHandlers}
          handleViewChange={handleViewChange}
          months={months}
          selectedYear={selectedYear}
          goToPreviousYear={goToPreviousYear}
          goToNextYear={goToNextYear}
          navigateToMonth={navigateToMonth}
        />
      </div>
      
      <div className="w-full mt-4">
        <TaskBoard
          dropZones={dropZones}
          dropZoneRefs={dropZoneRefs}
          externalTasks={tasks}
          handleExternalTaskClick={taskHandlers.handleExternalTaskClick}
          onDeleteTask={taskHandlers.handleDeleteTask}
          resources={resources}
        />
      </div>

      <TaskForm
        isOpen={calendarState.isFormOpen}
        onClose={handleFormClose}
        selectedDates={calendarState.selectedDates}
        selectedTask={calendarState.selectedTask}
        resources={resources}
        statuses={statuses}
        onSubmit={handleFormSubmit}
        isProcessing={calendarState.isProcessing}
      />
    </div>
  );
};