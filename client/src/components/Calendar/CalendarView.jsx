// CalendarView.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { CalendarMain } from './CalendarMain';
import { TaskBoard } from '../tasks/TaskBoard';
import { TaskForm } from '../tasks/TaskForm';
import { useDraggableSetup } from '../../hooks/useDraggableSetup';
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
  });

  // Année actuellement sélectionnée dans le calendrier
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Zones de dépôt pour le TaskBoard
  const dropZones = useMemo(() => [
    { id: 'todo', statusId: '1', title: 'À faire' },
    { id: 'inProgress', statusId: '2', title: 'En cours' },
    { id: 'blocked', statusId: '3', title: 'Bloqué' },
    { id: 'done', statusId: '4', title: 'Terminé' }
  ], []);

  const dropZoneRefs = useRef(dropZones.map(() => React.createRef()));
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

  // Hook pour configurer les éléments draggables
  useDraggableSetup(dropZoneRefs, boardTasks, setHasLocalChanges);

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
      <div className="w-full mt-20 p-4 calendar">
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
          updateTaskStatus={taskHandlers.updateTaskStatus}
        />
      </div>

      {/* Indicateur de changements non synchronisés */}
      {hasLocalChanges && (
        <SyncIndicator onSync={syncChanges} />
      )}

      <TaskForm
        isOpen={calendarState.isFormOpen}
        onClose={() => setCalendarState((prev) => ({
          ...prev,
          isFormOpen: false,
          selectedTask: null,
          selectedDates: null,
        }))}
        selectedDates={calendarState.selectedDates}
        selectedTask={calendarState.selectedTask}
        resources={resources}
        statuses={statuses}
        onSubmit={taskHandlers.handleTaskSubmit}
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