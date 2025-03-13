// CalendarView.jsx avec références restaurées
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { CalendarMain } from './CalendarMain';
import { TaskBoard } from '../tasks/TaskBoard';
import { TaskForm } from '../tasks/TaskForm';
import { useSyncChanges } from '../../hooks/useSyncChanges';
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
    taskboardDestination: null // Pour stocker la destination lors d'un déplacement
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
  // Utiliser useMemo pour que les références ne soient pas recréées à chaque rendu
  const dropZoneRefs = useMemo(() => {
    return { current: dropZones.map(() => React.createRef()) };
  }, [dropZones]);

  const calendarRef = useRef(null);
  
  // Récupération des données du calendrier
  const { tasks, setTasks, resources, holidays, statuses } = useCalendarData();
  
  // État des changements locaux
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  
  // Séparation des tâches entre le calendrier et le tableau de bord
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [boardTasks, setBoardTasks] = useState([]);

  // Traiter les tâches brutes quand elles changent
  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;

    const calendar = tasks.filter(task => task.resourceId);
    const board = tasks.filter(task => !task.resourceId);
    
    setCalendarTasks(calendar);
    setBoardTasks(board);
  }, [tasks]);

  // Hook pour gérer la synchronisation des changements
  const { syncChanges } = useSyncChanges(hasLocalChanges, setHasLocalChanges);

  // Fonction pour gérer le déplacement vers un taskboard (surtout pour le taskboard 2)
  const handleMoveTaskToZone = (taskId, targetZoneStatusId) => {
    // Récupérer la zone de destination
    const targetZone = dropZones.find(zone => zone.statusId === targetZoneStatusId);
    if (!targetZone) return;
    
    // Si le taskboard de destination a le statusId '2', ouvrir le formulaire d'édition
    if (targetZone.statusId === '2') {
      const taskToModify = [...calendarTasks, ...boardTasks].find(
        task => task.id.toString() === taskId.toString()
      );
      
      if (taskToModify) {
        // Ouvrir le formulaire avec la tâche sélectionnée
        setCalendarState((prev) => ({
          ...prev,
          isFormOpen: true,
          selectedTask: taskToModify,
          selectedDates: null,
          taskboardDestination: targetZone.statusId
        }));
        return;
      }
    }
    
    // Pour les autres taskboards, mettre à jour immédiatement
    if (taskHandlers && taskHandlers.updateTaskStatus) {
      taskHandlers.updateTaskStatus(taskId, {
        extendedProps: {
          statusId: targetZone.statusId
        }
      });
    }
  };

  // Gérer la fermeture du formulaire
  const handleFormClose = () => {
    setCalendarState((prev) => ({
      ...prev,
      isFormOpen: false,
      selectedTask: null,
      selectedDates: null,
      taskboardDestination: null
    }));
  };

  // Gérer la soumission du formulaire
  const handleFormSubmit = (updatedTask) => {
    // Si la tâche provient d'un déplacement vers le taskboard '2'
    if (calendarState.taskboardDestination === '2') {
      // S'assurer que le statusId est mis à jour correctement
      updatedTask = {
        ...updatedTask,
        extendedProps: {
          ...updatedTask.extendedProps,
          statusId: '2'
        }
      };
    }
    
    // Appeler le gestionnaire de soumission normal
    if (taskHandlers && taskHandlers.handleTaskSubmit) {
      taskHandlers.handleTaskSubmit(updatedTask);
    }
    
    // Réinitialiser l'état du taskboard de destination
    setCalendarState((prev) => ({
      ...prev,
      taskboardDestination: null,
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
    calendarTasks,
    boardTasks,
    setCalendarTasks,
    setBoardTasks,
    dropZoneRefs,
    dropZones,
    holidays,
    calendarRef,
    setHasLocalChanges
  );

  // Hook pour la navigation dans le calendrier
  const { 
    navigateToMonth, 
    goToPreviousYear, 
    goToNextYear, 
    handleViewChange,
    months
  } = useCalendarNavigation(calendarRef, selectedYear, setSelectedYear);

  // Debugging
  console.log("CalendarView render:", {
    taskboardsCount: dropZones.length,
    refsCount: dropZoneRefs.current?.length,
    boardTasksCount: boardTasks.length
  });

  return (
    <div className="flex flex-col dashboard">
      <div className="w-full calendar">
        <CalendarMain
          calendarRef={calendarRef}
          calendarTasks={calendarTasks}
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
          externalTasks={boardTasks}
          handleExternalTaskClick={taskHandlers.handleExternalTaskClick}
          onDeleteTask={taskHandlers.handleDeleteTask}
          updateTaskStatus={handleMoveTaskToZone}
        />
      </div>

      {/* Indicateur de changements non synchronisés */}
      {hasLocalChanges && (
        <SyncIndicator onSync={syncChanges} />
      )}

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

// Petit composant pour l'indicateur de synchronisation
const SyncIndicator = ({ onSync }) => (
  <div 
    className="fixed bottom-4 right-4 bg-yellow-100 p-2 rounded shadow cursor-pointer"
    onClick={onSync}
  >
    Changements non synchronisés. Cliquez pour synchroniser.
  </div>
);