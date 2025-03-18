import React, { useState, useRef, useEffect } from 'react';
import { Trash2} from 'lucide-react';
import { Draggable } from '@fullcalendar/interaction';

export const TaskBoard = ({
  dropZones = [],
  dropZoneRefs,
  externalTasks = [],
  handleExternalTaskClick,
  onDeleteTask,
  resources = []
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

  // Fonction pour formater une date en format lisible
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';

      // Format: JJ/MM/YYYY
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Date invalide';
    }
  };

  // Fonction pour obtenir le nom d'une ressource à partir de son ID
  const getResourceName = (resourceId) => {
    if (!resourceId) return 'Non assigné';

    const resource = resources.find(r => r.id.toString() === resourceId.toString());
    return resource ? resource.title : `ID: ${resourceId}`;
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

    // Configuration des draggables FullCalendar seulement pour les zones qui ne sont pas statusId '2'
    effectiveRefs.current.forEach((ref, index) => {
      if (!ref || !ref.current) {
        console.warn(`Référence ${index} non disponible`);
        return;
      }

      // Ne pas créer de draggable pour la zone avec statusId '2'
      const zone = dropZones[index];
      if (zone && zone.statusId === '2') {
        return;
      }

      try {
        // Créer un draggable pour chaque zone (sauf la zone '2')
        const draggable = new Draggable(ref.current, {
          itemSelector: '.fc-event',
          eventData: function (eventEl) {
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

          // Déterminer si cette zone est la zone "En cours" (statusId '2')
          const isInProgressZone = zone.statusId === '2';

          return (
            <div
              key={zone.id}
              ref={effectiveRefs.current[index]}
              className={`flex-1 w-1/4 p-4 rounded mt-4 ${isInProgressZone ? 'bg-blue-50' : 'bg-gray-100 dropzone'}`}
              data-status-id={zone.statusId}
              data-zone-id={zone.id}
            >
              <h3 className={`mb-4 font-bold ${isInProgressZone ? 'text-blue-700' : ''}`}>
                {zone.title} {isInProgressZone}
              </h3>
              {zoneTasks.map(task => {
                return (
                  <div
                    key={task.id}
                    data-task-id={task.id}
                    className={`${isInProgressZone ? '' : 'fc-event'} p-2 mb-2 bg-white border rounded hover:bg-gray-50 relative ${isInProgressZone ? 'border-blue-200' : ''}`}
                    onClick={() => handleExternalTaskClick && handleExternalTaskClick(task)}
                  >
                    <div className="font-medium">{task.title}</div>

                    {/* Affichage amélioré pour le taskboard 2 */}
                    {isInProgressZone ? (
                      <>
                        {task.resourceId && (
                          <div className="text-xs text-blue-600 mt-1">
                            <span className="font-medium">Assigné à:</span> {getResourceName(task.resourceId)}
                          </div>
                        )}

                        {/* Dates de la tâche */}
                        <div className="text-xs text-gray-600 mt-1">
                          <div><span className="font-medium">Début:</span> {formatDate(task.start)}</div>
                          <div><span className="font-medium">Fin:</span> {formatDate(task.end)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Affichage standard pour les autres taskboards */}
                        <div className="text-xs text-gray-500">ID: {task.id}</div>
                        {task.resourceId && (
                          <div className="text-xs text-blue-600 mt-1">
                            Assigné: {task.resourceId}
                          </div>
                        )}
                      </>
                    )}

                    <button
                      className="text-gray-400 hover:text-red-500 focus:outline-none"
                      onClick={(e) => openDeleteModal(e, task)}
                      title="Supprimer la tâche"
                    >
                      <Trash2 size={16} />
                    </button>


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