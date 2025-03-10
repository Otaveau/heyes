import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Draggable } from '@fullcalendar/interaction';

export const TaskBoard = ({ 
  dropZones, 
  dropZoneRefs,
  externalTasks, 
  handleExternalTaskClick,
  onDeleteTask,
  updateTaskStatus
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const draggablesRef = useRef([]);
  
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
      }
    }
    closeDeleteModal();
  };

  // Fonction pour déplacer une tâche vers une autre zone
  const moveTaskToZone = (taskId, targetZoneStatusId) => {
    updateTaskStatus(taskId, {
      extendedProps: {
        statusId: targetZoneStatusId
      }
    });
  };

  // Fonction pour obtenir la prochaine/précédente zone
  const getNextZone = (currentStatusId) => {
    const currentIndex = dropZones.findIndex(zone => zone.statusId === currentStatusId);
    if (currentIndex < dropZones.length - 1) {
      return dropZones[currentIndex + 1];
    }
    return null;
  };

  const getPreviousZone = (currentStatusId) => {
    const currentIndex = dropZones.findIndex(zone => zone.statusId === currentStatusId);
    if (currentIndex > 0) {
      return dropZones[currentIndex - 1];
    }
    return null;
  };

  // Initialisation des draggables FullCalendar pour le calendrier
  useEffect(() => {
    // Nettoyage des anciens draggables
    draggablesRef.current.forEach(draggable => {
      if (draggable) draggable.destroy();
    });
    draggablesRef.current = [];

    // Configuration des draggables FullCalendar
    dropZoneRefs.current.forEach((ref, index) => {
      if (!ref.current) return;

      // Créer un draggable pour chaque zone
      const draggable = new Draggable(ref.current, {
        itemSelector: '.fc-event',
        eventData: function(eventEl) {
          const taskId = eventEl.getAttribute('data-task-id');
          const task = externalTasks.find(t => t.id.toString() === taskId.toString());
          
          if (!task) return {};
          
          return {
            id: task.id,
            title: task.title,
            start: task.start || new Date(),
            end: task.end || new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            allDay: true,
            extendedProps: { 
              statusId: task.extendedProps?.statusId || task.statusId,
              description: task.extendedProps?.description || ''
            }
          };
        }
      });
      
      draggablesRef.current[index] = draggable;
    });

    return () => {
      // Nettoyage lors du démontage
      draggablesRef.current.forEach(draggable => {
        if (draggable) draggable.destroy();
      });
    };
  }, [externalTasks]);

  return (
    <>
      <div className="flex w-full space-x-4 backlogs">
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
              className="flex-1 w-1/4 p-4 bg-gray-100 rounded mt-4 dropzone"
              data-status-id={zone.statusId}
              data-zone-id={zone.id}
            >
              <h3 className="mb-4 font-bold">{zone.title}</h3>
              {zoneTasks.map(task => {
                const currentStatusId = task.extendedProps?.statusId || task.statusId;
                const nextZone = getNextZone(currentStatusId);
                const prevZone = getPreviousZone(currentStatusId);
                
                return (
                  <div
                    key={task.id}
                    data-task-id={task.id}
                    className="fc-event p-2 mb-2 bg-white border rounded hover:bg-gray-50 relative"
                    onClick={() => handleExternalTaskClick(task)}
                  >
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-gray-500">ID: {task.id}</div>
                    
                    {/* Actions de tâche */}
                    <div className="flex justify-end mt-2 pt-2 border-t">
                      {prevZone && (
                        <button
                          className="mr-2 text-gray-400 hover:text-blue-500 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTaskToZone(task.id, prevZone.statusId);
                          }}
                          title={`Déplacer vers ${prevZone.title}`}
                        >
                          <ArrowLeft size={16} />
                        </button>
                      )}
                      
                      <button 
                        className="text-gray-400 hover:text-red-500 focus:outline-none"
                        onClick={(e) => openDeleteModal(e, task)}
                        title="Supprimer la tâche"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      {nextZone && (
                        <button
                          className="ml-2 text-gray-400 hover:text-blue-500 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTaskToZone(task.id, nextZone.statusId);
                          }}
                          title={`Déplacer vers ${nextZone.title}`}
                        >
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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