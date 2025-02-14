import React, { useState, useEffect, useRef } from 'react';
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

  const { tasks, setTasks, resources, statuses } = useCalendarData();

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
  } = useTaskHandlers(setTasks, setCalendarState, statuses, tasks);
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




  // const handleEventDrop = async (dropInfo) => {
  //   const { event } = dropInfo;
  //   const taskId = parseInt(event.id);

  //   const existingTask = tasks.find(t => t.id === taskId);

  //   const startDate = new Date(event.start);
  //   const endDate = event._def.extendedProps.end || event._instance.range.end;
  //   const endDateObj = new Date(endDate);
  //   const resourceId = parseInt(event._def.resourceIds[0] || null, 10);


  //   try {
  //     const updates = {
  //       ...existingTask,
  //       start: formatUTCDate(startDate),
  //       end: formatUTCDate(endDateObj),
  //       resourceId: resourceId,
  //       statusId: STATUS_IDS.WIP,
  //       source: 'calendar',
  //       isCalendarTask: true
  //     };

  //     await updateTask(taskId, updates);

  //     // Mettre à jour l'état local des tâches
  //     setTasks(prevTasks =>
  //       prevTasks.map(task =>
  //         task.id === taskId ? { ...task, ...updates } : task
  //       )
  //     );

  //   } catch (error) {
  //     console.error('Erreur lors de la mise à jour de la tâche:', error);
  //     dropInfo.revert();
  //   }
  // };


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

