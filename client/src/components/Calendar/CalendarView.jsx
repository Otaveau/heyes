// CalendarView.jsx avec support d'affichage des tâches à la fois dans le calendrier et taskboard 2
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
    
    // Pour le board, on inclut les tâches sans resourceId
    // ET les tâches qui ont le statusId '2' (même si elles ont un resourceId)
    const board = tasks.filter(task => {
      const statusId = task.extendedProps?.statusId || task.statusId;
      return !task.resourceId || statusId === '2';
    });
    
    setCalendarTasks(calendar);
    setBoardTasks(board);
    
  }, [tasks]);

  // Hook pour gérer la synchronisation des changements
  const { syncChanges } = useSyncChanges(hasLocalChanges, setHasLocalChanges);

  // Fonction pour gérer le déplacement vers un taskboard
  const handleMoveTaskToZone = (taskId, targetZoneStatusId) => {
    // Récupérer la zone de destination
    const targetZone = dropZones.find(zone => zone.statusId === targetZoneStatusId);
    if (!targetZone) return;
    
    // Trouver la tâche à déplacer
    const allTasks = [...calendarTasks, ...boardTasks];
    const taskToModify = allTasks.find(task => task.id.toString() === taskId.toString());
    
    if (!taskToModify) {
      console.error(`Tâche non trouvée: ${taskId}`);
      return;
    }
    
    // Si le taskboard de destination a le statusId '2', ouvrir le formulaire d'édition
    if (targetZone.statusId === '2') {
      // Ouvrir le formulaire avec la tâche sélectionnée
      setCalendarState(prev => ({
        ...prev,
        isFormOpen: true,
        selectedTask: taskToModify,
        selectedDates: null,
        taskboardDestination: targetZone.statusId,
        taskOriginId: taskId
      }));
    } else {
      // Pour les autres taskboards, mettre à jour immédiatement
      updateTaskDirectly(taskId, targetZoneStatusId);
    }
  };
  
  // Fonction pour mettre à jour directement une tâche
  const updateTaskDirectly = (taskId, newStatusId) => {
    if (taskHandlers && taskHandlers.updateTaskStatus) {
      // Mettre à jour l'état global des tâches
      const updatedTasks = tasks.map(task => {
        if (task.id.toString() === taskId.toString()) {
          return {
            ...task,
            resourceId: null,
            extendedProps: {
              ...task.extendedProps,
              statusId: newStatusId
            }
          };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      setHasLocalChanges(true);
    }
  };

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
      setHasLocalChanges(true);
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