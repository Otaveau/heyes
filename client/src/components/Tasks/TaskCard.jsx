export const TaskCard = ({ task, statusName, onTaskClick }) => {
  const handleDragStart = (e) => {
    // Données de la tâche pour le drag and drop
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      start: task.start_date || task.start,
      end: task.end_date || task.end,
      resourceId: task.owner_id || task.resourceId,
      status_id: task.status_id,
      source: 'backlog'
    };

    e.dataTransfer.setData('application/json', JSON.stringify(taskData));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClick = () => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`task-card bg-white p-3 rounded shadow-sm border border-gray-200 
        ${statusName?.toLowerCase() === 'wip' ? 'border-blue-400' : ''} 
        cursor-move hover:bg-gray-50 transition-colors duration-200`}
    >
      <h4 className="font-medium">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
      )}
      {(task.resourceId || task.owner_id) && (
        <div className="text-sm text-blue-600 mt-1">
          Assigné à: {task.resourceId || task.owner_id}
        </div>
      )}
      {(task.start || task.start_date) && (task.end || task.end_date) && (
        <div className="text-xs text-gray-500 mt-1">
          {new Date(task.start || task.start_date).toLocaleDateString()} - 
          {new Date(task.end || task.end_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};