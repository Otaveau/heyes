import React, { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import { AlertCircle } from 'lucide-react';
import { createCalendarOptions } from './CalendarConfig';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { TaskForm } from '../Tasks/TaskForm';
import { BacklogTaskList } from '../Backlogs/BacklogTaskList';
import { DEFAULT_TASK_DURATION } from '../../constants/constants';
import '../../style/CalendarView.css';

export const CalendarView = () => {
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
  });

  const { tasks, setTasks, resources, holidays, statuses, error: dataError } = useCalendarData();

  const {
    handleSubmit,
    handleStatusUpdate,
    handleTaskClick,
    handleEventClick,
    handleEventResize,
    handleEventDrop,
    handleDrop,
    handleEventReceive,
  } = useTaskHandlers(setTasks, setCalendarState, statuses, tasks);

  const handleDateSelect = useCallback((selectInfo) => {
    if (!selectInfo.start) return;

    setCalendarState((prev) => ({
      ...prev,
      selectedDates: {
        start: selectInfo.start,
        end: selectInfo.end || new Date(selectInfo.start.getTime() + DEFAULT_TASK_DURATION),
        resourceId: selectInfo.resource?.id,
      },
      isFormOpen: true,
    }));
  }, []);


  const calendarOptions = useMemo(() => createCalendarOptions({
    resources,
    tasks,
    setTasks,
    statuses,
    showWeekends: calendarState.showWeekends,
    setShowWeekends: (value) => setCalendarState((prev) => ({
      ...prev,
      showWeekends: value,
    })),
    holidays,
    handleDateSelect,
    handleEventResize: (info) => handleEventResize(info, calendarState.isProcessing),
    handleEventClick: (clickInfo) => handleEventClick(clickInfo),
    handleEventDrop: (dropInfo) => handleEventDrop(dropInfo, calendarState.isProcessing, statuses, tasks, setTasks),
    handleDrop,
    handleEventReceive,
    isProcessing: calendarState.isProcessing,
  }), [
    resources,
    tasks,
    setTasks,
    statuses,
    calendarState.showWeekends,
    calendarState.isProcessing,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop,
    handleDrop,
    handleEventReceive,
  ]);

  if (dataError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        <span>Erreur de chargement des données: {dataError.message}</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-col">
        <div className="flex-1 p-4">
          <FullCalendar {...calendarOptions} />
        </div>

        <TaskForm
          isOpen={calendarState.isFormOpen}
          onClose={() => setCalendarState((prev) => ({
            ...prev,
            isFormOpen: false,
            selectedTask: null,
          }))}
          selectedDates={calendarState.selectedDates}
          selectedTask={calendarState.selectedTask}
          resources={resources}
          statuses={statuses}
          onSubmit={handleSubmit}
          isProcessing={calendarState.isProcessing}
        />

        <BacklogTaskList
          statuses={statuses}
          tasks={tasks}
          onStatusUpdate={handleStatusUpdate}
          resources={resources}
          onTaskClick={handleTaskClick}
          className="mt-4"
        />
      </div>
    </div>
  );
};
