import React from 'react';
import { Calendar, User } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

export const TaskCard = ({
  task,
  statusName = '',
  onTaskClick,
  className = '',
  disabled = false
}) => {
  if (!task) return null;

  const {
    id,
    title,
    description,
    start_date,
    end_date,
    owner_id,
    resourceId,
    statusId,
    start,
    end
  } = task;

  const handleDragStart = (e) => {
    if (disabled) {
        e.preventDefault();
        return;
    }

    const taskData = {
        id: task.id,
        title: task.title,
        description: task.description,
        startDate: start_date || start,
        endDate: end_date || end,
        resourceId: owner_id || resourceId,
        statusId: statusId,
        source: 'backlog'
    };

    // Ajouter une classe pour le style pendant le drag
    e.target.classList.add('dragging');
    
    // Important : définir les données avant les effets visuels
    e.dataTransfer.setData('application/json', JSON.stringify(taskData));
};

// Ajouter un handleDragEnd
const handleDragEnd = (e) => {
  e.target.classList.remove('dragging');
};

  const handleClick = () => {
    if (!disabled && onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const startDateFormatted = formatDate(start_date || start);
  const endDateFormatted = formatDate(end_date || end);
  const assignedTo = owner_id || resourceId;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      className={`
    task-card 
    bg-white 
    p-4 
    rounded-lg 
    shadow-sm 
    border 
    ${statusName?.toLowerCase() === 'wip' ? 'border-blue-400' : 'border-gray-200'}
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-move hover:bg-gray-50'} 
    transition-all 
    duration-200
    focus:outline-none 
    focus:ring-2 
    focus:ring-blue-400
    ${className}
  `}
      data-task-id={id}
      aria-disabled={disabled}
    >
      <h4 className="font-medium text-gray-900 break-words">{title}</h4>

      {description && (
        <p className="text-sm text-gray-600 mt-2 break-words line-clamp-2">
          {description}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {assignedTo && (
          <div className="flex items-center text-sm text-gray-700">
            <User size={14} className="mr-2" />
            <span>Assigné à: {assignedTo}</span>
          </div>
        )}

        {startDateFormatted && endDateFormatted && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar size={14} className="mr-2" />
            <span>
              {startDateFormatted} - {endDateFormatted}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};