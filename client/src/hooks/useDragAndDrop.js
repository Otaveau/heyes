import { useState, useCallback } from 'react';

export const useDragAndDrop = (tasks, onTaskUpdate) => {
  const [draggingTask, setDraggingTask] = useState(null);

  const handleDragStart = useCallback((task) => {
    setDraggingTask(task);
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination || !draggingTask) return;

    const { source, destination } = result;
    const newStatus = destination.droppableId;
    const updatedTask = { ...draggingTask };

    if (source.droppableId === destination.droppableId) {
      return;
    }

    if (newStatus === 'wip' && !updatedTask.resourceId) {
      setDraggingTask(null);
      return;
    }

    if (newStatus !== 'wip') {
      updatedTask.resourceId = null;
    }

    updatedTask.status = newStatus;
    await onTaskUpdate(updatedTask);
    setDraggingTask(null);
  }, [draggingTask, onTaskUpdate]);

  const isWeekendOrHoliday = useCallback((date, holidays) => {
    const day = new Date(date).getDay();
    const dateStr = new Date(date).toISOString().split('T')[0];
    return day === 0 || day === 6 || holidays.includes(dateStr);
  }, []);

  const validateDrop = useCallback((startDate, endDate, holidays) => {
    if (isWeekendOrHoliday(startDate, holidays) || isWeekendOrHoliday(endDate, holidays)) {
      return false;
    }
    return true;
  }, [isWeekendOrHoliday]);

  return {
    handleDragStart,
    handleDragEnd,
    validateDrop,
    isWeekendOrHoliday,
    draggingTask
  };
};