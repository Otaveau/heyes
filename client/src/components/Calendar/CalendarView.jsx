import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { TaskForm } from '../Tasks/TaskForm';
import { toast } from 'react-toastify';


export const CalendarView = () => {
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
  });

  // Définir les zones de drop et leurs statuts associés
  const dropZones = useMemo(() => [
    { id: 'todo', statusId: '1', title: 'À faire' },
    { id: 'inProgress', statusId: '2', title: 'En cours' },
    { id: 'blocked', statusId: '3', title: 'Bloqué' },
    { id: 'done', statusId: '4', title: 'Terminé' }
  ], []); 

  const dropZoneRefs = useRef(dropZones.map(() => React.createRef()));

  const { tasks, setTasks, updateTask, resources, statuses } = useCalendarData();
  const [externalTasks, setExternalTasks] = useState([]);

  const {
    handleTaskSubmit,
    handleDateSelect,
    // handleStatusUpdate,
    // handleTaskClick,
    handleCalendarEventClick,
    handleEventDrop,
    handleExternalDrop,
    handleEventResize,
    // handleDrop,
    // handleEventReceive,
  } = useTaskHandlers(setTasks, setCalendarState, statuses, tasks, externalTasks);

  // Séparer les tasks avec et sans ressource
  useEffect(() => {
    if (!tasks) return;
    console.log('CalendarView useEffect tasks :', tasks);
    const tasksWithoutResource = tasks.filter(task => !task.resourceId);
    console.log('CalendarView useEffect tasksWithoutResource :', tasksWithoutResource);
    setExternalTasks(tasksWithoutResource);
  }, [tasks]);


  useEffect(() => {
    // Créer des draggables pour chaque zone de drop
    const draggables = dropZoneRefs.current.map(ref => {
      if (!ref.current) return null;

      return new Draggable(ref.current, {
        itemSelector: '.fc-event',
        eventData: function(eventEl) {
          const taskId = eventEl.getAttribute('data-task-id');
          const task = externalTasks.find(t => t.id.toString() === taskId);

          if (!task) return null;

          return {
            id: task.id.toString(),
            title: task.title,
            start: task.start || new Date(),
            end: task.end,
            allDay: true,
            extendedProps: { ...task }
          };
        }
      });
    });

    // Cleanup function
    return () => {
      draggables.forEach(draggable => {
        if (draggable) draggable.destroy();
      });
    };
  }, [externalTasks, dropZones]);

  useEffect(() => {
    dropZoneRefs.current.forEach(ref => {
      const element = ref.current;
      
      const handleDragOver = (e) => {
        e.preventDefault();
        element.classList.add('drag-over');
      };
  
      const handleDragLeave = () => {
        element.classList.remove('drag-over');
      };
  
      const handleDrop = () => {
        element.classList.remove('drag-over');
      };
  
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);
  
      return () => {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      };
    });
  }, []);

  const handleEventRemove = useCallback(async (info, targetStatusId) => {
    const taskId = parseInt(info.event.id);
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    try {
      const updatedTask = {
        ...task,
        resourceId: null,
        statusId: targetStatusId,
      };

      await updateTask(taskId, updatedTask);
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? updatedTask : t
        )
      );

      toast.success(`Tâche déplacée vers ${dropZones.find(zone => zone.statusId === targetStatusId)?.title}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      info.revert();
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  }, [tasks, updateTask, setTasks, dropZones]);


  return (
    <div className="flex">
      <div className="w-48 space-y-4">
        {dropZones.map((zone, index) => (
          <div
            key={zone.id}
            ref={dropZoneRefs.current[index]}
            className="p-4 bg-gray-100 rounded droppable-zone"
            data-status-id={zone.statusId}
          >
            <h3 className="mb-4 font-bold">{zone.title}</h3>
            {externalTasks
              .filter(task => task.statusId === zone.statusId)
              .map(task => (
                <div
                  key={task.id}
                  data-task-id={task.id.toString()}
                  className="fc-event p-2 mb-2 bg-white border rounded cursor-move hover:bg-gray-50"
                >
                  {task.title || 'Sans titre'}
                  <div className="text-xs text-gray-500">ID: {task.id}</div>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="flex-1 p-4" style={{ width: '2000px' }}>
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          height='auto'
          schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
          initialView="resourceTimelineYear"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineYear,resourceTimelineMonth,resourceTimelineWeek'
          }}
          editable={true}
          selectable={true}
          selectMirror={true} // Optionnel : affiche un aperçu de la sélection
          droppable={true}
          events={tasks}
          resources={resources}
          resourceAreaWidth="15%"
          slotDuration={{ days: 1 }}
          selectConstraint={{
            start: '00:00',
            end: '24:00'
          }}
          eventDrop={handleEventDrop}
          drop={handleExternalDrop}
          select={handleDateSelect}
          eventClick={handleCalendarEventClick}
          eventResize={handleEventResize}
          eventDragStop={(info) => {
            const eventRect = info.jsEvent.target.getBoundingClientRect();
            
            // Vérifier chaque zone de drop
            dropZoneRefs.current.forEach((ref, index) => {
              const dropZoneEl = ref.current;
              const dropZoneRect = dropZoneEl.getBoundingClientRect();

              // Si l'événement est déplacé dans cette zone
              if (
                eventRect.left >= dropZoneRect.left &&
                eventRect.right <= dropZoneRect.right &&
                eventRect.top >= dropZoneRect.top &&
                eventRect.bottom <= dropZoneRect.bottom
              ) {
                handleEventRemove(info, dropZones[index].statusId);
              }
            });
          }}
          eventReceive={(info) => {
            // Gérer la réception d'un événement dans le calendrier
            const taskId = parseInt(info.event.id);
            const resourceId = info.event._def.resourceIds[0];
            
            const task = externalTasks.find(t => t.id === taskId);
            if (task) {
              const updates = {
                ...task,
                resourceId: resourceId ? parseInt(resourceId, 10) : null,
                start: info.event.start,
                end: info.event.end || new Date(info.event.start.getTime() + 24*60*60*1000),
                statusId: '2' // Mettre à jour le statut si nécessaire
              };

              updateTask(taskId, updates)
                .then(() => {
                  setTasks(prevTasks =>
                    prevTasks.map(t =>
                      t.id === taskId ? updates : t
                    )
                  );
                })
                .catch(error => {
                  console.error('Erreur lors de la mise à jour:', error);
                  info.revert();
                });
            }
          }}
        />
      </div>

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
        onSubmit={handleTaskSubmit}
        isProcessing={calendarState.isProcessing}
      />
    </div>
  );
};

