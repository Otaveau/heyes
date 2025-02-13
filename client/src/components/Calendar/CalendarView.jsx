import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { formatUTCDate } from '../../utils/dateUtils';
import { useCalendarData } from '../../hooks/useCalendarData';
import { STATUS_IDS } from '../../constants/constants';

export const CalendarView = () => {

  const { tasks, updateTask, setTasks, resources } = useCalendarData();
  const [externalTasks, setExternalTasks] = useState([]);
  const externalEventsRef = useRef(null);

  // Séparer les tasks avec et sans ressource
  useEffect(() => {
    if (!tasks) return;
    console.log('CalendarView useEffect tasks :', tasks);
    const tasksWithoutResource = tasks.filter(task => !task.resourceId);
    console.log('CalendarView useEffect tasksWithoutResource :', tasksWithoutResource);
    setExternalTasks(tasksWithoutResource);
  }, [tasks]);


  useEffect(() => {
    if (!externalEventsRef.current) return;

    const draggable = new Draggable(externalEventsRef.current, {
      itemSelector: '.fc-event',
      eventData: function (eventEl) {

        const taskId = eventEl.getAttribute('data-task-id');
        const task = externalTasks.find(t => t.id === taskId);

        return {
          id: task?.id?.toString() || `new-${Date.now()}`,
          title: task?.title || eventEl.innerText || 'Nouvelle tâche',
          start: new Date(), // Date par défaut
          allDay: true,
          duration: { days: 1 }, // Durée par défaut
          extendedProps: task ? { ...task } : {}
        };
      }
    });

    return () => draggable.destroy();
  }, [externalTasks]);


  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    const taskId = parseInt(event.id);

    const existingTask = tasks.find(t => t.id === taskId);

    // Création de nouvelles dates avec ajustement du fuseau horaire
    const startDate = new Date(event.start);
    
    const endDate = event._def.extendedProps.end || event._instance.range.end;
    const endDateObj = new Date(endDate);
    const resourceId = parseInt(event._def.resourceIds[0] || null, 10);

    // Log pour debug
    console.log('StartDate avant formatage:', startDate);
    console.log('EndDate avant formatage:', endDateObj);

    try {
        const updates = {
            ...existingTask,
            start: formatUTCDate(startDate),
            end: formatUTCDate(endDateObj),
            resourceId: resourceId,
            statusId: STATUS_IDS.WIP,
            source: 'calendar',
            isCalendarTask: true
        };

        console.log('Updates à envoyer:', updates);
        await updateTask(taskId, updates);
        
        // Mettre à jour l'état local des tâches
        setTasks(prevTasks => 
            prevTasks.map(task => 
                task.id === taskId ? { ...task, ...updates } : task
            )
        );

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        dropInfo.revert();
    }
};


  const handleExternalDrop = async (info) => {
    if (!info.draggedEl.parentNode) return;

    try {

      console.log('CalendarView handleExternalDrop info : ', info);
      const taskId = info.draggedEl.getAttribute('data-task-id');
      const endDate = info._def.extendedProps.end || info._instance.range.end;
      const resourceId = parseInt(info.resource?._resource?.id || null, 10);

      const numericId = parseInt(taskId, 10);
      const existingTask = externalTasks.find(t => t.id.toString() === taskId);

      console.log('CalendarView handleExternalDrop existingTasks : ', existingTask);

      if (!existingTask) {
        console.error(`Task with id ${taskId} not found in externalTasks`);
        return;
      }

      const updates = {
        ...existingTask,
        start: formatUTCDate(info.date),
        end: formatUTCDate(endDate),
        resourceId: resourceId,
        statusId: STATUS_IDS.WIP,
        source: 'calendar',
        isCalendarTask: true
      };

      await updateTask(numericId, updates);

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
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
            data-task-id={task.id.toString()}
            className="fc-event p-2 mb-2 bg-white border rounded cursor-move hover:bg-gray-50"
            style={{ backgroundColor: task.color }}
          >
            {task.title || 'Sans titre'}
            <div className="text-xs text-gray-500">ID: {task.id}</div>
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
          droppable={true}
          events={tasks}
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

