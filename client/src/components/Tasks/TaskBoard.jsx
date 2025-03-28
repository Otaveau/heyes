import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Draggable } from '@fullcalendar/interaction';
import { DateUtils } from '../../utils/dateUtils';

export const TaskBoard = ({
  dropZones = [],
  dropZoneRefs,
  externalTasks = [],
  handleExternalTaskClick,
  onDeleteTask,
  resources = [],
  onMoveTask
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

  // Fonction pour déplacer une tâche vers la gauche (statut précédent)
  const moveTaskLeft = (e, task) => {
    e.stopPropagation(); // Empêcher le clic de se propager

    // Trouver l'index de la zone actuelle
    const currentZoneIndex = dropZones.findIndex(zone => {
      const statusId = task.extendedProps?.statusId || task.statusId;
      return zone.statusId === statusId;
    });

    // S'il y a une zone à gauche, déplacer la tâche
    if (currentZoneIndex > 0) {
      const targetZone = dropZones[currentZoneIndex - 1];
      if (onMoveTask) {
        onMoveTask(task.id, targetZone.statusId);
      }
    }
  };

  // Fonction pour déplacer une tâche vers la droite (statut suivant)
  const moveTaskRight = (e, task) => {
    e.stopPropagation(); // Empêcher le clic de se propager

    // Trouver l'index de la zone actuelle
    const currentZoneIndex = dropZones.findIndex(zone => {
      const statusId = task.extendedProps?.statusId || task.statusId;
      return zone.statusId === statusId;
    });

    // S'il y a une zone à droite, déplacer la tâche
    if (currentZoneIndex < dropZones.length - 1) {
      const targetZone = dropZones[currentZoneIndex + 1];
      if (onMoveTask) {
        onMoveTask(task.id, targetZone.statusId);
      }
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
            if (eventEl.getAttribute('data-is-conge') === 'true') {
              return null;
            }
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
  }, [effectiveRefs, externalTasks, dropZones, dropZoneRefs]);

  return (
    <>
      <div className="flex w-full space-x-4 backlogs taskboard-container">
        {dropZones.map((zone, index) => {
          // S'assurer que les refs sont initialisées
          if (!effectiveRefs.current[index]) {
            effectiveRefs.current[index] = React.createRef();
          }

          const zoneTasks = externalTasks.filter(task => {

            // Stratégie de récupération du statusId
            const extractStatusId = () => {
              // Vérifier dans différentes sources possibles
              if (task.statusId) return task.statusId.toString();
              if (task.extendedProps?.statusId) return task.extendedProps.statusId.toString();
              if (task.status) return task.status.toString();

              // Valeur par défaut si aucun statusId trouvé
              return null;
            };

            const taskStatusId = extractStatusId();

            // Vérifier si c'est un congé 
            const isConge =
              task.isConge === true ||
              task.extendedProps?.isConge === true ||
              task.title === 'CONGE';

            // Si c'est un congé et que le tableau courant est "En cours" (statusId === '2'),
            // alors ne pas inclure cette tâche
            if (isConge) {
              return false;
            }

            return taskStatusId === zone.statusId;
          });

          const isInProgressZone = zone.statusId === '2';

          return (
            <div
              key={zone.id}
              ref={effectiveRefs.current[index]}
              className={`flex-1 w-1/4 p-5 rounded mt-5 potential-drop-target ${isInProgressZone ? 'bg-blue-50' : 'bg-gray-100 dropzone'}`}
              data-status-id={zone.statusId}
              data-zone-id={zone.id}
              data-dropzone-id={zone.id}
            >
              <h3 className={`mb-4 font-bold ${isInProgressZone ? 'text-blue-700' : ''}`}>
                {zone.title} {isInProgressZone}
              </h3>
              {zoneTasks.map(task => {

                // Vérifier si c'est un congé
                const isConge =
                  task.isConge === true ||
                  task.extendedProps?.isConge === true ||
                  task.title === 'CONGE';

                return (
                  <div
                    key={task.id}
                    data-task-id={task.id}
                    className={`${isConge ? 'conge-task' : 'fc-event'} p-2 mb-2 bg-white border rounded hover:bg-gray-50 relative`}
                    data-is-conge={isConge ? 'true' : 'false'}
                    onClick={() => handleExternalTaskClick && handleExternalTaskClick(task)}
                  >
                    {/* Titre affiché pour toutes les tâches */}
                    <div className="font-medium">{task.title}</div>

                    {/* Description affichée pour toutes les tâches si elle existe */}
                    {(task.description || task.extendedProps?.description) && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {task.description || task.extendedProps?.description}
                      </div>
                    )}

                    {/* Informations supplémentaires uniquement pour le taskboard "En cours" */}
                    {isInProgressZone && (
                      <>
                        {task.resourceId && (
                          <div className="text-xs text-blue-600 mt-1">
                            <span className="font-medium">Assigné à:</span> {getResourceName(task.resourceId)}
                          </div>
                        )}

                        {/* Dates de la tâche */}
                        <div className="text-xs text-gray-600 mt-1">
                          <div><span className="font-medium">Début:</span> {formatDate(task.start)}</div>
                          <div><span className="font-medium">Fin:</span> {formatDate(DateUtils.getInclusiveEndDate(task))}</div>
                        </div>
                      </>
                    )}

                    {/* Barre d'actions avec boutons de déplacement et suppression */}
                    <div className="flex justify-end mt-2 space-x-2">
                      {/* Flèche gauche - visible sauf pour le premier taskboard */}
                      {index > 0 && (
                        <button
                          className="p-1 text-gray-500 hover:text-blue-500 focus:outline-none"
                          onClick={(e) => moveTaskLeft(e, task)}
                          title="Déplacer vers la gauche"
                        >
                          <ArrowLeft size={16} />
                        </button>
                      )}

                      {/* Bouton de suppression */}
                      <button
                        className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                        onClick={(e) => openDeleteModal(e, task)}
                        title="Supprimer la tâche"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Flèche droite - visible sauf pour le dernier taskboard */}
                      {index < dropZones.length - 1 && (
                        <button
                          className="p-1 text-gray-500 hover:text-blue-500 focus:outline-none"
                          onClick={(e) => moveTaskRight(e, task)}
                          title="Déplacer vers la droite"
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