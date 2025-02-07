import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { useCalendarData } from '../../hooks/useCalendarData';
import { STATUS_TYPES } from '../../constants/constants';

export const CalendarView = () => {

  const { tasks, updateTask, resources }  = useCalendarData();
  const [events, setEvents] = useState([]);
  const [externalTasks, setExternalTasks] = useState([]);
  const externalEventsRef = useRef(null);

  // Séparer les tasks avec et sans ressource
  useEffect(() => {
    const tasksWithResource = tasks.filter(task => task.resourceId);
    const tasksWithoutResource = tasks.filter(task => !task.resourceId);
    
    setEvents(tasksWithResource);
    setExternalTasks(tasksWithoutResource);
  }, [tasks]);

  useEffect(() => {
    if (!externalEventsRef.current) return;
    
    const draggable = new Draggable(externalEventsRef.current, {
      itemSelector: '.fc-event',
      eventData: function(eventEl) {
        // Récupérer l'ID de la task depuis le data-task-id
        const taskId = eventEl.getAttribute('data-task-id');
        const task = externalTasks.find(t => t.id === taskId);
        
        return {
          id: taskId,
          title: task?.title || eventEl.innerText,
          resourceId: 'resource1',
          allDay: task?.allDay || true,
          // Ajouter d'autres propriétés de la task si nécessaire
          extendedProps: task
        };
      }
    });

    return () => draggable.destroy();
  }, [externalTasks]);


  useEffect(() => {
    setEvents(tasks);
  }, [tasks]);


  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    try {
      const updates = {
        start: event.start,
        end: event.end,
        resourceId: event.getResources()[0]?.id || 'resource1',
        //statusId: STATUS_TYPES.WIP,
        source: 'calendar',
        isCalendarTask: true
      };

      await updateTask(event.id, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      dropInfo.revert();
    }
  };

  const handleExternalDrop = async (info) => {
    if (!info.draggedEl.parentNode) return;

    try {
      const taskId = info.draggedEl.getAttribute('data-task-id');
      const existingTask = externalTasks.find(t => t.id === taskId);
      
      if (existingTask) {
        // Mettre à jour une task existante
        const updates = {
          ...existingTask,
          start: info.dateStr,
          resourceId: info.resource?.id || 'resource1',
          statusId: STATUS_TYPES.WIP,
          source: 'calendar',
          isCalendarTask: true
        };
        await updateTask(taskId, updates);
      }

      // Optionnel : supprimer l'élément du DOM si c'est désiré
      if (info.draggedEl.parentNode === externalEventsRef.current) {
        info.draggedEl.parentNode.removeChild(info.draggedEl);
      }
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour de la tâche:', error);
    }
  };

  return (
    <div className="flex">
      <div 
        ref={externalEventsRef}
        className="w-48 p-4 bg-gray-100"
      >
        <h3 className="mb-4 font-bold">Tâches non assignées</h3>
        {externalTasks.map(task => (
          <div 
            key={task.id}
            data-task-id={task.id}
            className="fc-event p-2 mb-2 bg-white border rounded cursor-move hover:bg-gray-50"
            style={{ backgroundColor: task.color }}
          >
            {task.title}
          </div>
        ))}
      </div>

      <div className="flex-1 p-4" style={{ width: '2000px' }}>
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          height='auto'
          schedulerLicenseKey= 'GPL-My-Project-Is-Open-Source'
          initialView="resourceTimelineYear"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineYear,resourceTimelineMonth,resourceTimelineWeek'
          }}
          editable={true}
          droppable={true}
          events={events}
          resources={resources}
          resourceAreaWidth="15%"
          slotDuration={{ days: 1 }}
          eventDrop={handleEventDrop}
          drop={handleExternalDrop}
        />
      </div>
    </div>
  );
};

