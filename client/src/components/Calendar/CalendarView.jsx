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

  // Gérer le déplacement des tâches entre les taskboards
  // Gérer le déplacement des tâches entre les taskboards
  const handleMoveTask = (taskId, newStatusId) => {
    // Trouver la tâche à déplacer
    const taskToMove = tasks.find(task => task.id.toString() === taskId.toString());

    if (!taskToMove) {
      console.error(`Tâche avec l'ID ${taskId} non trouvée`);
      return;
    }

    // Si la tâche est déplacée vers le taskboard "En cours" (statusId '2')
    if (newStatusId === '2') {
      // Ouvrir le formulaire pour modifier la tâche
      setCalendarState(prev => ({
        ...prev,
        isFormOpen: true,
        selectedTask: taskToMove,
        taskboardDestination: '2',
        taskOriginId: taskId
      }));
    } else {
      // Pour les autres taskboards, mettre à jour directement le statut
      // et réinitialiser les dates et le propriétaire

      // Vérifier si la tâche est actuellement dans le taskboard "En cours"
      const isMovingFromInProgress = (taskToMove.extendedProps?.statusId === '2' || taskToMove.statusId === '2');

      // Préparer les mises à jour
      const updates = {
        statusId: newStatusId,
        extendedProps: {
          ...taskToMove.extendedProps,
          statusId: newStatusId
        }
      };

      // Si la tâche sort du taskboard "En cours", réinitialiser les dates et le propriétaire
      if (isMovingFromInProgress) {
        updates.start = null;
        updates.end = null;
        updates.start_date = null;
        updates.end_date = null;
        updates.resourceId = null;
        updates.owner_id = null;
      }

      // Utiliser handleTaskUpdate du hook pour mise à jour ET persistance en base de données
      taskHandlers.handleTaskUpdate(
        taskId,
        updates,
        {
          successMessage: `Tâche déplacée vers ${dropZones.find(zone => zone.statusId === newStatusId)?.title || 'nouveau statut'}`,
          skipApiCall: false // S'assurer que l'appel API est effectué
        }
      );
    }
  };

  // Gérer la soumission du formulaire
  const handleFormSubmit = async (updatedTask) => {
    try {
      // Si la tâche provient d'un déplacement vers le taskboard '2'
      if (calendarState.taskboardDestination === '2') {
        // Vérifier si un propriétaire est assigné et si des dates sont définies
        const hasOwner = Boolean(updatedTask.resourceId || updatedTask.owner_id);
        const hasDates = Boolean(updatedTask.start || updatedTask.start_date);

        if (!hasOwner || !hasDates) {
          // Rechercher la tâche originale pour obtenir son statusId précédent
          const originalTask = tasks.find(task => task.id.toString() === updatedTask.id.toString());
          const originalStatusId = originalTask?.statusId || '1'; // Fallback à 'À faire' si non trouvé

          // Utiliser le statut d'origine si différent de '2'
          const targetStatusId = originalStatusId === '2' ? '1' : originalStatusId;

          // Mettre à jour avec l'ancien statut et sans dates/propriétaire
          updatedTask = {
            ...updatedTask,
            start: null,
            end: null,
            start_date: null,
            end_date: null,
            resourceId: null,
            owner_id: null,
            statusId: targetStatusId,
            extendedProps: {
              ...updatedTask.extendedProps,
              statusId: targetStatusId
            }
          };

          // Utiliser la méthode handleTaskUpdate du hook pour mise à jour et appel API
          await taskHandlers.handleTaskUpdate(
            updatedTask.id,
            updatedTask,
            {
              successMessage: "Tâche non modifiée - Un propriétaire et des dates sont requis pour les tâches en cours",
              skipApiCall: false // S'assurer que l'appel API est effectué
            }
          );
        } else {
          // Si les conditions sont remplies, mettre à jour normalement vers le statut '2'
          updatedTask = {
            ...updatedTask,
            statusId: '2', // Mettre à jour le statusId principal
            extendedProps: {
              ...updatedTask.extendedProps,
              statusId: '2' // Conserver le statusId '2' pour qu'elle reste visible dans le taskboard
            }
          };

          // Utiliser la méthode handleTaskUpdate du hook pour mise à jour et appel API
          await taskHandlers.handleTaskUpdate(
            updatedTask.id,
            updatedTask,
            {
              successMessage: "Tâche mise à jour avec succès",
              skipApiCall: false // S'assurer que l'appel API est effectué
            }
          );
        }
      } else {
        console.log('updatedTask:', updatedTask);
        // Pour les autres cas, utiliser le gestionnaire normal
        await taskHandlers.handleTaskSubmit(updatedTask);
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
    } catch (error) {
      console.error('Erreur dans handleFormSubmit:', error);

      // S'assurer que le formulaire est fermé même en cas d'erreur
      setCalendarState(prev => ({
        ...prev,
        isFormOpen: false,
        taskboardDestination: null,
        taskOriginId: null,
        selectedTask: null,
        selectedDates: null
      }));
    }
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
          onMoveTask={handleMoveTask}
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