import React, { useState } from 'react';
import { TaskCard } from '../Tasks/TaskCard';
import { TaskForm } from '../Tasks/TaskForm';

export const BacklogContainer = ({ 
  status, 
  statusName, 
  tasks, 
  onStatusUpdate, 
  resources, 
  statuses, 
  onTaskClick 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const findStatusByType = (type) => {
    return statuses.find(s => s.status_type.toLowerCase() === type.toLowerCase())?.status_id;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    try {
      const taskData = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('Dropped task data:', taskData);
      
      const currentStatusId = taskData.status_id || taskData.status;
      const targetStatusId = parseInt(status);
      
      console.log('Status comparison:', {
        currentStatusId,
        targetStatusId
      });

      if (currentStatusId !== targetStatusId) {
        const wipStatusId = findStatusByType('wip');

        if (statusName.toLowerCase() === 'wip') {
          if (!taskData.resourceId) {
            // Ouvrir le formulaire uniquement pour le status WIP sans ressource
            setSelectedTask({
              ...taskData,
              status_id: targetStatusId
            });
            setIsFormOpen(true);
          } else {
            await onStatusUpdate(taskData.id, targetStatusId);
          }
        } else {
          // Pour tous les autres statuts, mise à jour directe
          await onStatusUpdate(taskData.id, targetStatusId);
        }
      } else {
        console.log('No status update needed - same status_id');
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
};

  const handleFormSubmit = async (formData) => {
    try {
      const wipStatusId = findStatusByType('wip');
      const updatedStatus = statusName.toLowerCase() === 'entrant' ? wipStatusId : status;

      if (updatedStatus === wipStatusId && !formData.resourceId) {
        throw new Error('Une ressource doit être sélectionnée pour le statut WIP');
      }

      const updatedData = {
        ...selectedTask,
        ...formData,
        status_id: updatedStatus  // Changé de status à status_id
      };
      
      await onStatusUpdate(selectedTask.id, updatedStatus, updatedData);
      setIsFormOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.message);
    }
};

  const handleTaskDrag = (task) => {
    return JSON.stringify({
      id: task.id,
      title: task.title,
      description: task.description,
      start: task.start,
      end: task.end,
      resourceId: task.resourceId,
      status: task.status,
      source: 'backlog'
    });
  };

  const handleTaskCardClick = (task) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      setSelectedTask(task);
      setIsFormOpen(true);
    }
  };

  return (
    <div 
      className="flex-1 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className="text-lg font-semibold mb-4">{statusName}</h3>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            draggable={true}
            onDragStart={() => handleTaskDrag(task)}
            onTaskClick={handleTaskCardClick}
          />
        ))}
      </div>

      {isFormOpen && (
        <TaskForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedTask(null);
          }}
          selectedTask={selectedTask}
          resources={resources}
          statuses={statuses}
          onSubmit={handleFormSubmit}
          requireResource={statusName.toLowerCase() === 'entrant' || statusName.toLowerCase() === 'wip'}
        />
      )}
    </div>
  );
};