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
        if (statusName.toLowerCase() === 'wip') {
          // Pour WIP, toujours ouvrir le formulaire pour sélectionner dates et ressource
          setSelectedTask({
            ...taskData,
            status_id: targetStatusId
          });
          setIsFormOpen(true);
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
      // Pour WIP, vérifier que tous les champs requis sont présents
      if (statusName.toLowerCase() === 'wip') {
        if (!formData.resourceId || !formData.startDate || !formData.endDate) {
          throw new Error('Pour le statut WIP, vous devez sélectionner une ressource et des dates de début et de fin');
        }
      }

      const updatedData = {
        ...selectedTask,
        ...formData,
        status_id: status
      };

      await onStatusUpdate(selectedTask.id, status, updatedData);
      setIsFormOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.message);
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
            onTaskClick={onTaskClick}
            statusName={statusName}
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
          requireResource={statusName.toLowerCase() === 'wip'}
        />
      )}
    </div>
  );
};