import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';

export const useDraggableSetup = (dropZoneRefs, boardTasks, setHasLocalChanges) => {
  const draggablesRef = useRef([]);
  
  // Gestion des draggables
  useEffect(() => {
    // Nettoyer les anciens draggables
    draggablesRef.current.forEach(draggable => {
      if (draggable) draggable.destroy();
    });
    draggablesRef.current = [];

    // Créer les nouveaux draggables
    dropZoneRefs.current.forEach((ref, index) => {
      if (!ref.current) return;

      const draggable = new Draggable(ref.current, {
        itemSelector: '.fc-event',
        eventData: function (eventEl) {
          const taskId = eventEl.getAttribute('data-task-id');
          const task = boardTasks.find(t => t.id.toString() === taskId.toString());

          if (!task) return {};

          return {
            id: task.id,
            title: task.title,
            start: task.start || new Date(),
            end: task.end || new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            allDay: true,
            extendedProps: { 
              statusId: task.extendedProps?.statusId || task.statusId,
              description: task.extendedProps?.description || ''
            }
          };
        }
      });

      draggablesRef.current[index] = draggable;
    });

    return () => {
      draggablesRef.current.forEach(draggable => {
        if (draggable) draggable.destroy();
      });
      draggablesRef.current = [];
    };
  }, [boardTasks, dropZoneRefs]);

  return draggablesRef;
};