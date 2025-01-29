import React from 'react';

export const TaskCard = ({ task, draggable, onTaskClick }) => {
  const handleDragStart = (e) => {
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      start: task.start_date || task.start,
      end: task.end_date || task.end,
      resourceId: task.owner_id || task.resourceId,
      status_id: task.status_id || task.status, // Utiliser status_id de préférence
      source: 'backlog'
    };
    e.dataTransfer.setData('application/json', JSON.stringify(taskData));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClick = (e) => {
    // Vérifier si le clic n'est pas lié à un début de drag
    if (!e.defaultPrevented && onTaskClick) {
      onTaskClick(task);
    }
  };

  // Combiner les classes pour le curseur : move pour drag, pointer pour clic
  const cursorClass = draggable && onTaskClick ? "cursor-move hover:cursor-pointer" : "cursor-move";

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`bg-white p-3 rounded shadow-sm border border-gray-200 ${cursorClass} hover:bg-gray-50 transition-colors duration-200`}
    >
      <h4 className="font-medium">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
      )}
      {task.resourceId && (
        <div className="text-sm text-blue-600 mt-1">
          Assigné à: {task.resourceId}
        </div>
      )}
      {task.start && task.end && (
        <div className="text-xs text-gray-500 mt-1">
          {new Date(task.start).toLocaleDateString()} - {new Date(task.end).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};