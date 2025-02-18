import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { TaskForm } from '../Tasks/TaskForm';


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
  const { tasks, setTasks, resources, statuses } = useCalendarData();
  const [externalTasks, setExternalTasks] = useState([]);
  const draggablesRef = useRef([]);

  const {
    handleTaskSubmit,
    handleDateSelect,
    handleExternalTaskClick,
    handleCalendarEventClick,
    handleEventDragStop,
    handleEventDrop,
    handleExternalDrop,
    handleEventResize,
    handleEventReceive
  } = useTaskHandlers(
    setTasks,
    setCalendarState,
    statuses,
    tasks,
    externalTasks,
    dropZoneRefs,
    dropZones,
    setExternalTasks  
  );

  // Gestionnaire des tâches externes unique
  useEffect(() => {
    console.log('Tasks reçus:', tasks);

    if (!tasks || !Array.isArray(tasks)) {
      console.log('Pas de tâches disponibles');
      return;
    }

    // Filtrer les tâches sans ressource
    const tasksWithoutResource = tasks.filter(task => {
      const hasNoResource = !task.resourceId || task.resourceId === null || task.resourceId === undefined;
      return hasNoResource;
    });

    console.log('Tâches sans ressource trouvées:', tasksWithoutResource);

    // Formatter les tâches
    const formattedTasks = tasksWithoutResource.map(task => ({
      ...task,
      id: task.id.toString(),
      statusId: task.statusId || '1',
      title: task.title || 'Sans titre'
    }));

    console.log('Tâches formatées:', formattedTasks);
    setExternalTasks(formattedTasks);
  }, [tasks]);

  useEffect(() => {
    if (!dropZoneRefs.current) {
        console.warn('dropZoneRefs.current is undefined');
        return;
    }

    console.log('dropZoneRefs initialized:', dropZoneRefs.current);
}, []);

  // Gestionnaire unique des draggables
  useEffect(() => {
    console.log('Mise à jour des draggables avec', externalTasks.length, 'tâches externes');

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
          console.log('Recherche de la tâche avec ID:', taskId);
          const task = externalTasks.find(t => t.id === taskId);

          if (!task) {
            console.log('Tâche non trouvée pour ID:', taskId);
            return null;
          }

          console.log('Tâche trouvée:', task);
          return {
            id: task.id,
            title: task.title,
            start: task.start || new Date(),
            end: task.end || new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            allDay: true,
            extendedProps: { ...task }
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
  }, [externalTasks, dropZones]);


  // Gestionnaire des événements de drag
  useEffect(() => {
    dropZoneRefs.current.forEach(ref => {
      if (!ref.current) return;

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


  return (
    <div className="flex dashboard">

      <div className="flex-1 p-4 calendar">
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
          eventDragStop={handleEventDragStop}
          eventReceive={handleEventReceive} 
        />
      </div>

      <div className="flex w-full space-y-4 backlogs">

        {dropZones.map((zone, index) => {
          if (!dropZoneRefs?.current?.[index]) {
            console.warn(`Ref for zone ${index} is not properly initialized`);
            return null;
        }
          const zoneStatusId = Number(zone.statusId);
          const zoneTasks = externalTasks.filter(task =>
            Number(task.statusId) === zoneStatusId
          );

          return (
            <div
              key={zone.id}
              ref={dropZoneRefs.current[index]}
              className="flex-1 w-1/4 p-4 bg-gray-100 rounded mt-4"
              data-status-id={zone.statusId}
            >
              <h3 className="mb-4 font-bold">{zone.title}</h3>
              {externalTasks.length > 0 && zoneTasks.map(task => (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  className="fc-event p-2 mb-2 bg-white border rounded cursor-move hover:bg-gray-50"
                  onClick={() => handleExternalTaskClick(task)}
                >
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-gray-500">ID: {task.id}</div>
                </div>
              ))}
            </div>
          );
        })}
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

