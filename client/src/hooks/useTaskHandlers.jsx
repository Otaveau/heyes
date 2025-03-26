import { useDragDropHandlers } from './useDragDropHandlers';
import { useTaskMutationHandlers } from './useTaskMutationHandler';
import { useCalendarEventHandlers } from './useCalendarEventHandlers';
import { useExternalTaskHandlers } from './useExternalTaskHandlers';


export const useTaskHandlers = (
  setTasks,
  setCalendarState,
  tasks,
  dropZoneRefs,
  dropZones,
  holidays
) => {
  // Importer les différents groupes de gestionnaires
  const dragDropHandlers = useDragDropHandlers(dropZoneRefs, dropZones);
  const taskMutationHandlers = useTaskMutationHandlers(setTasks, setCalendarState, tasks, holidays);
  const calendarEventHandlers = useCalendarEventHandlers(
    setCalendarState, 
    tasks, 
    taskMutationHandlers.updateTaskStatus, 
    taskMutationHandlers.handleTaskUpdate,
    holidays
  );
  const externalTaskHandlers = useExternalTaskHandlers(
    setTasks,
    tasks,
    setCalendarState, 
    taskMutationHandlers.updateTaskStatus,
    taskMutationHandlers.handleTaskUpdate,
    holidays,
    dropZoneRefs,
    dropZones
  );

  // Retourner toutes les fonctions nécessaires
  return {
    ...taskMutationHandlers,
    ...calendarEventHandlers,
    ...dragDropHandlers,
    ...externalTaskHandlers
  };
};