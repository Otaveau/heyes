import React, { useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { TaskCard } from '../Tasks/TaskCard';
import { TaskForm } from '../Tasks/TaskForm';

export const BacklogContainer = ({
  status,
  statusName,
  tasks = [],
  onStatusUpdate,
  resources = [],
  statuses = [],
  onTaskClick,
  className = ''
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const isWipStatus = statusName.toLowerCase() === 'wip';

  const resetState = useCallback(() => {
    setIsFormOpen(false);
    setSelectedTask(null);
    setError(null);
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragActive(true);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);

    try {
      // Log détaillé de tous les types de données disponibles
      console.log('Drop event data types:', e.dataTransfer.types);
      
      // Essayer de récupérer les données de plusieurs façons
      let taskData;
      
      // Essayer JSON en premier
      try {
        const jsonData = e.dataTransfer.getData('application/json');
        console.log('JSON data:', jsonData);
        taskData = JSON.parse(jsonData);
      } catch (jsonError) {
        // Essayer texte brut si JSON échoue
        try {
          const textData = e.dataTransfer.getData('text/plain');
          console.log('Text data:', textData);
          taskData = JSON.parse(textData);
        } catch (textError) {
          console.error('Impossible de parser les données:', textError);
          throw new Error('Données de tâche invalides');
        }
      }

      console.log('Parsed task data:', taskData);

      // Normaliser la récupération du statusId
      const currentStatusId = taskData.statusId || 
                               taskData.status_id || 
                               taskData.status || 
                               taskData.statusId;
      const targetStatusId = parseInt(status);

      if (currentStatusId === targetStatusId) {
        console.log('Pas de changement de statut nécessaire');
        return;
      }

      if (isWipStatus) {
        setSelectedTask({
          ...taskData,
          status_id: targetStatusId
        });
        setIsFormOpen(true);
      } else {
        await onStatusUpdate(taskData.id, targetStatusId);
      }
    } catch (error) {
      console.error('Erreur de drop:', error);
      setError('Erreur lors du déplacement de la tâche');
    }
}, [status, isWipStatus, onStatusUpdate]);


  const handleFormSubmit = useCallback(async (formData) => {
    setError(null);
    
    try {
      if (isWipStatus) {
        const missingFields = [];
        if (!formData.resourceId) missingFields.push('une ressource');
        if (!formData.startDate) missingFields.push('une date de début');
        if (!formData.endDate) missingFields.push('une date de fin');

        if (missingFields.length > 0) {
          throw new Error(
            `Pour le statut WIP, vous devez sélectionner ${missingFields.join(', ')}`
          );
        }

        // Vérifier que la date de fin est après la date de début
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
          throw new Error('La date de fin doit être postérieure à la date de début');
        }
      }

      const updatedData = {
        ...selectedTask,
        ...formData,
        status_id: status
      };

      await onStatusUpdate(selectedTask.id, status, updatedData);
      resetState();
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.message);
    }
  }, [selectedTask, status, isWipStatus, onStatusUpdate, resetState]);

  const handleCloseForm = useCallback(() => {
    resetState();
  }, [resetState]);

  return (
    <div
      role="region"
      aria-label={`Liste des tâches ${statusName}`}
      className={`
        relative 
        flex-1 
        bg-gray-50 
        p-4 
        rounded-lg 
        transition-all 
        duration-200
        ${dragActive ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:bg-gray-100'}
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{statusName}</h3>
        <span className="text-sm text-gray-500">
          {tasks.length} tâche{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div 
        className="space-y-2 min-h-[100px]"
        aria-live="polite"
      >
        {tasks.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Déposez une tâche ici
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              statusName={statusName}
              onTaskClick={onTaskClick}
            />
          ))
        )}
      </div>

      {isFormOpen && (
        <TaskForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          selectedTask={selectedTask}
          resources={resources}
          statuses={statuses}
          onSubmit={handleFormSubmit}
          requireResource={isWipStatus}
        />
      )}
    </div>
  );
};