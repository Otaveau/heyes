import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export const TaskBoard = ({ 
  dropZones, 
  dropZoneRefs,
  externalTasks, 
  handleExternalTaskClick,
  onDeleteTask
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Fonction pour ouvrir la modal de confirmation
  const openDeleteModal = (e, task) => {
    e.stopPropagation(); // Empêche le déclenchement du onClick du parent
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  // Fonction pour fermer la modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTaskToDelete(null);
  };


  const confirmDelete = () => {
    if (taskToDelete) {
      if (onDeleteTask) {
        onDeleteTask(taskToDelete.id);
      } else {
        //console.log(`Suppression de la tâche ${taskToDelete.id}`);
      }
    }
    closeDeleteModal();
  };

  return (
    <>
      <div className="flex w-full space-y-4 backlogs">
        {dropZones.map((zone, index) => {
          if (!dropZoneRefs?.current?.[index]) {
            console.warn(`Ref for zone ${index} is not properly initialized`);
            return null;
          }
          
          const zoneTasks = externalTasks.filter(task => {
            const statusId = task.extendedProps?.statusId || task.statusId;
            return statusId === zone.statusId;
          });
          
          return (
            <div
              key={zone.id}
              ref={dropZoneRefs.current[index]}
              className="flex-1 w-1/4 p-4 bg-gray-100 rounded mt-4"
              data-status-id={zone.statusId}
            >
              <h3 className="mb-4 font-bold">{zone.title}</h3>
              {zoneTasks.map(task => (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  className="fc-event p-2 mb-2 bg-white border rounded cursor-move hover:bg-gray-50 relative"
                  onClick={() => handleExternalTaskClick(task)}
                >
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-gray-500">ID: {task.id}</div>
                  
                  {/* Icône de suppression */}
                  <button 
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 focus:outline-none"
                    onClick={(e) => openDeleteModal(e, task)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {zoneTasks.length === 0 && (
                <div className="text-gray-400 text-center p-2">
                  Pas de tâches
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteModalOpen && taskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirmer la suppression</h3>
            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer la tâche "{taskToDelete.title}" ?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={closeDeleteModal}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={confirmDelete}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};