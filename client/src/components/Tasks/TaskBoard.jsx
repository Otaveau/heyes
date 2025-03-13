import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Draggable } from '@fullcalendar/interaction';

export const TaskBoard = ({ 
  dropZones = [], 
  dropZoneRefs,
  externalTasks = [], 
  handleExternalTaskClick,
  onDeleteTask,
  updateTaskStatus
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const draggablesRef = useRef([]);
  
  // Créer des références locales si aucune n'est fournie
  const internalRefs = useRef([]);
  
  // Initialiser les références internes si nécessaire
  useEffect(() => {
    if (!internalRefs.current.length) {
      internalRefs.current = dropZones.map(() => React.createRef());
    }
  }, [dropZones]);
  
  // Utiliser les références externes si disponibles, sinon utiliser les références internes
  const effectiveRefs = dropZoneRefs || internalRefs;
  
  // Fonction pour ouvrir la modal de confirmation
  const openDeleteModal = (e, task) => {
    e.stopPropagation();
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  // Fonction pour fermer la modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const confirmDelete = () => {
    if (taskToDelete && onDeleteTask) {
      onDeleteTask(taskToDelete.id);
    }
    closeDeleteModal();
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
    // S'assurer que les refs sont initialisées
    if (!effectiveRefs.current || effectiveRefs.current.length === 0) {
      console.warn("Les références ne sont pas disponibles pour les draggables");
      return;
    }
    
    // Nettoyage des anciens draggables
    draggablesRef.current.forEach(draggable => {
      if (draggable) draggable.destroy();
    });
    draggablesRef.current = [];

    // Configuration des draggables FullCalendar
    effectiveRefs.current.forEach((ref, index) => {
      if (!ref || !ref.current) {
        console.warn(`Référence ${index} non disponible`);
        return;
      }

      try {
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
        console.log(`Draggable créé pour la zone ${index}`);
      } catch (error) {
        console.error(`Erreur lors de la création du draggable pour la zone ${index}:`, error);
      }
    });

    return () => {
      // Nettoyage lors du démontage
      draggablesRef.current.forEach(draggable => {
        if (draggable) draggable.destroy();
      });
    };
  }, [effectiveRefs, externalTasks, dropZones]);

  // Log de débogage
  console.log("TaskBoard render", { 
    zonesCount: dropZones.length, 
    refsCount: effectiveRefs.current.length,
    tasksCount: externalTasks.length 
  });

  return (
    <>
      <div className="flex w-full space-x-4 backlogs">
        {dropZones.map((zone, index) => {
          // S'assurer que les refs sont initialisées
          if (!effectiveRefs.current[index]) {
            effectiveRefs.current[index] = React.createRef();
          }
          
          const zoneTasks = externalTasks.filter(task => {
            const statusId = task.extendedProps?.statusId || task.statusId;
            return statusId === zone.statusId;
          });
          
          return (
            <div
              key={zone.id}
              ref={effectiveRefs.current[index]}
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
                    onClick={() => handleExternalTaskClick && handleExternalTaskClick(task)}
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
                            updateTaskStatus && updateTaskStatus(task.id, prevZone.statusId);
                          }}
                          title={`Déplacer vers ${prevZone.title}`}
                        >
                          <ArrowLeft size={24} className="transition-transform hover:scale-110" />
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
                            updateTaskStatus && updateTaskStatus(task.id, nextZone.statusId);
                          }}
                          title={`Déplacer vers ${nextZone.title}`}
                        >
                          <ArrowRight size={24} className="transition-transform hover:scale-110" />
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