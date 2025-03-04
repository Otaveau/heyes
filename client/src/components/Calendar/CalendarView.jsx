import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { TaskForm } from '../Tasks/TaskForm';
import { TaskBoard } from '../Tasks/TaskBoard';
import { DateUtils } from '../../utils/dateUtils';
import '../../style/CalendarView.css';


export const CalendarView = () => {
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
  });

  const dropZones = useMemo(() => [
    { id: 'todo', statusId: '1', title: 'À faire' },
    { id: 'inProgress', statusId: '2', title: 'En cours' },
    { id: 'blocked', statusId: '3', title: 'Bloqué' },
    { id: 'done', statusId: '4', title: 'Terminé' }
  ], []);


  const dropZoneRefs = useRef(dropZones.map(() => React.createRef()));
  const { tasks, setTasks, resources, holidays, statuses } = useCalendarData();
  const [externalTasks, setExternalTasks] = useState([]);
  const draggablesRef = useRef([]);
  const calendarRef = useRef(null);

  const {
    handleTaskSubmit,
    handleDateClick,
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
    tasks,
    externalTasks,
    dropZoneRefs,
    dropZones,
    holidays,
    calendarRef
  );

  const handleDeleteTask = (taskId) => {
    // Supprimer la tâche à la fois des tâches calendrier et externes
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
  };

  // Formater les tâches du calendrier
  const formattedCalendarTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }

    return tasks
      .filter(task => task.resourceId)
      .map(task => ({
        id: task.id?.toString() || '',
        title: task.title,
        start: task.start,
        end: task.end,
        resourceId: task.resourceId?.toString(),
        allDay: task.allDay || true,
        extendedProps: {
          ...task.extendedProps,
          statusId: task.extendedProps?.statusId || task.statusId || '1'
        }
      }));
  }, [tasks]);


  // Formater les tâches externes (backlog)
  const formattedExternalTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }

    return tasks
      .filter(task => !task.resourceId)
      .map(task => ({
        id: task.id?.toString() || '',
        statusId: task.extendedProps?.statusId || task.statusId || '1',
        title: task.title
      }));
  }, [tasks]);


  useEffect(() => {
    setExternalTasks(formattedExternalTasks);
  }, [formattedExternalTasks]);

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
          const task = externalTasks.find(t => t.id === taskId);

          if (!task) return {};

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


  return (
    <div className="flex flex-col dashboard">

      <div className="w-full p-4 calendar">
        <FullCalendar
          ref={calendarRef}
          locale={frLocale}
          timeZone='local'
          nextDayThreshold="00:00:00"
          slotLabelFormat={[
            { month: 'long' },
            { weekday: 'short', day: 'numeric' }
          ]}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'local'
          }}
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
          selectMirror={true}
          droppable={true}
          events={formattedCalendarTasks}
          resources={resources}
          resourceAreaWidth="15%"
          slotDuration={{ days: 1 }}
          selectConstraint={{
            start: '00:00',
            end: '24:00'
          }}
          weekends={true}
          eventAllow={(dropInfo) => {
            const startDate = new Date(dropInfo.start);
            const endDate = new Date(dropInfo.end);
            endDate.setDate(endDate.getDate() - 1);

            if (DateUtils.isHolidayOrWeekend(startDate, holidays) ||
              DateUtils.isHolidayOrWeekend(endDate, holidays)) {
              return false;
            }

            return true;
          }}
          slotLabelClassNames={(arg) => {
            if (!arg?.date) return [];
            const classes = [];
            if (arg.level === 1 && DateUtils.isHolidayOrWeekend(arg.date, holidays)) {
              classes.push(DateUtils.isHoliday(arg.date, holidays) ? 'holiday-slot' : 'weekend-slot');
            }
            return classes;
          }}

          slotLaneClassNames={(arg) => {
            if (!arg?.date) return '';
            return DateUtils.isHolidayOrWeekend(arg.date, holidays)
              ? DateUtils.isHoliday(arg.date, holidays)
                ? 'holiday-column'
                : 'weekend-column'
              : '';
          }}

          dayHeaderClassNames={(arg) => {
            if (!arg?.date) return '';

            // Faire un log pour déboguer si nécessaire
            console.log('Date header:', arg.date, 'isHoliday:', DateUtils.isHoliday(arg.date, holidays));

            return DateUtils.isHolidayOrWeekend(arg.date, holidays)
              ? DateUtils.isHoliday(arg.date, holidays)
                ? 'holiday-header'
                : 'weekend-header'
              : '';
          }}

          dayCellClassNames={(arg) => {
            if (!arg?.date) return [];
            const classes = [];

            if (DateUtils.isWeekend(arg.date)) {
              classes.push('weekend-cell');
            }

            if (DateUtils.isHoliday(arg.date, holidays)) {
              classes.push('holiday-cell');
            }

            return classes;
          }}
          eventDrop={handleEventDrop}
          drop={handleExternalDrop}
          select={handleDateClick}
          eventClick={handleCalendarEventClick}
          eventResize={handleEventResize}
          eventDragStop={handleEventDragStop}
          eventReceive={handleEventReceive}
        />
      </div>
      <div className="w-full mt-4">
        <TaskBoard
          dropZones={dropZones}
          dropZoneRefs={dropZoneRefs}
          externalTasks={externalTasks}
          handleExternalTaskClick={handleExternalTaskClick}
          onDeleteTask={handleDeleteTask}
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

