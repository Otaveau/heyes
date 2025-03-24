import { useCallback, useRef } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { DateUtils } from '../utils/dateUtils';


export const useExternalTaskHandlers = (
    setTasks,
    tasks,
    setCalendarState, 
    updateTaskStatus,
    handleTaskUpdate,
    holidays
  ) => {
    // Référence pour l'élément fantôme
    const ghostElementRef = useRef(null);
    
    // Fonction utilitaire pour obtenir la date de fin inclusive
    const getInclusiveEndDate = useCallback((task) => {
      // Si la date inclusive est stockée dans extendedProps
      if (task.extendedProps?.inclusiveEndDate) {
        return task.extendedProps.inclusiveEndDate;
      }
      
      // Si la tâche a une propriété end_date (supposée déjà inclusive)
      if (task.end_date) {
        return task.end_date;
      }
      
      // Si la tâche a une propriété end (exclusive, à convertir)
      if (task.end) {
        const endDate = new Date(task.end);
        endDate.setDate(endDate.getDate() - 1); // Convertir en date inclusive
        return endDate;
      }
      
      return null;
    }, []);
  
    // Clic sur une tâche externe
    const handleExternalTaskClick = useCallback((task) => {
      const fullTask = tasks.find(t => t.id.toString() === task.id.toString());
      if (!fullTask) return;
      
      // Obtenir la date de fin inclusive
      const inclusiveEndDate = getInclusiveEndDate(fullTask);
  
      // Utiliser les dates en incluant la date de fin inclusive
      setCalendarState(prev => ({
        ...prev,
        isFormOpen: true,
        selectedTask: {
          id: fullTask.id,
          title: fullTask.title,
          description: fullTask.extendedProps?.description || '',
          statusId: fullTask.extendedProps?.statusId || task.statusId || '1',
          resourceId: fullTask.resourceId || null,
          start: fullTask.start,
          end: fullTask.end, // Date exclusive pour FullCalendar
          extendedProps: {
            ...(fullTask.extendedProps || {}),
            inclusiveEndDate: inclusiveEndDate // Explicitement stocker la date inclusive
          }
        }
      }));
    }, [setCalendarState, tasks, getInclusiveEndDate]);
  
    // Mettre en surbrillance le TaskBoard
    const highlightTaskBoard = useCallback((isHighlighted) => {
      const taskBoardContainer = document.querySelector('.taskboard-container');
      if (taskBoardContainer) {
        if (isHighlighted) {
          taskBoardContainer.classList.add('taskboard-highlight');
        } else {
          taskBoardContainer.classList.remove('taskboard-highlight');
          taskBoardContainer.classList.remove('taskboard-highlight-intense');
        }
      }
    }, []);
  
    // Animation de transition vers le TaskBoard
    const simulateImmediateAppearance = useCallback((taskId, targetDropZone) => {
      if (!ghostElementRef.current) return;
      
      const dropZoneEl = document.querySelector(`[data-dropzone-id="${targetDropZone.id}"]`);
      if (!dropZoneEl) return;
      
      const dropZoneRect = dropZoneEl.getBoundingClientRect();
      const ghostRect = ghostElementRef.current.getBoundingClientRect();
  
      const ghost = ghostElementRef.current;
  
      // Position cible centrée dans la zone
      const targetX = dropZoneRect.left + (dropZoneRect.width / 2) - (ghostRect.width / 2);
      const targetY = dropZoneRect.top + 10;
  
      ghost.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.2s ease, transform 0.2s ease';
      ghost.style.left = `${targetX}px`;
      ghost.style.top = `${targetY}px`;
      ghost.style.transform = 'scale(0.9)';
  
      // Créer un placeholder temporaire
      const placeholderTask = document.createElement('div');
      placeholderTask.className = 'fc-event temporary-task-placeholder';
      placeholderTask.setAttribute('data-task-id', taskId);
      placeholderTask.style.opacity = '0';
      placeholderTask.style.height = `${ghostRect.height}px`;
      placeholderTask.style.margin = '8px 0';
      placeholderTask.style.transition = 'opacity 0.2s ease';
      placeholderTask.innerText = ghostElementRef.current.innerText;
  
      dropZoneEl.appendChild(placeholderTask);
  
      setTimeout(() => placeholderTask.style.opacity = '1', 50);
  
      setTimeout(() => {
        ghost.style.opacity = '0';
  
        setTimeout(() => {
          if (ghostElementRef.current) {
            document.body.removeChild(ghostElementRef.current);
            ghostElementRef.current = null;
          }
  
          try {
            if (placeholderTask.parentNode) {
              placeholderTask.parentNode.removeChild(placeholderTask);
            }
          } catch (e) {
            console.error('Erreur lors du nettoyage du placeholder:', e);
          }
        }, 200);
      }, 180);
    }, []);
  
    // Vérifier si un événement est au-dessus d'une zone de dépôt
    const isEventOverDropZone = useCallback((eventPosition) => {
      const dropZoneElements = document.querySelectorAll('.potential-drop-target');
      
      // Réinitialiser les styles de toutes les zones
      dropZoneElements.forEach(el => {
        el.classList.remove('active-drop-target');
      });
  
      // Vérifier chaque zone
      for (let i = 0; i < dropZoneElements.length; i++) {
        const dropZoneEl = dropZoneElements[i];
        const rect = dropZoneEl.getBoundingClientRect();
  
        if (eventPosition.x >= rect.left &&
            eventPosition.x <= rect.right &&
            eventPosition.y >= rect.top &&
            eventPosition.y <= rect.bottom) {
  
          dropZoneEl.classList.add('active-drop-target');
          return { 
            dropZone: {
              id: dropZoneEl.getAttribute('data-dropzone-id') || i.toString(),
              statusId: dropZoneEl.getAttribute('data-status-id') || '1',
              title: dropZoneEl.getAttribute('data-title') || 'Colonne'
            } 
          };
        }
      }
  
      return null;
    }, []);
  
    // Créer l'élément fantôme pour le glisser-déposer
    const createGhostElement = useCallback((info) => {
      if (ghostElementRef.current) {
        document.body.removeChild(ghostElementRef.current);
      }
  
      const ghostEl = document.createElement('div');
      ghostEl.className = 'task-ghost-element';
  
      const originalRect = info.el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(info.el);
  
      ghostEl.innerHTML = `<div class="ghost-title">${info.event.title}</div>`;
      ghostEl.style.position = 'fixed';
      ghostEl.style.zIndex = '9999';
      ghostEl.style.pointerEvents = 'none';
      ghostEl.style.width = `${originalRect.width}px`;
      ghostEl.style.height = `${originalRect.height}px`;
      ghostEl.style.backgroundColor = computedStyle.backgroundColor || '#4a6cf7';
      ghostEl.style.color = computedStyle.color || 'white';
      ghostEl.style.borderRadius = computedStyle.borderRadius || '4px';
      ghostEl.style.padding = computedStyle.padding || '4px';
      ghostEl.style.opacity = '0.9';
      ghostEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      ghostEl.style.transition = 'transform 0.05s ease';
      ghostEl.style.fontFamily = computedStyle.fontFamily;
      ghostEl.style.fontSize = computedStyle.fontSize;
      ghostEl.style.display = 'flex';
      ghostEl.style.alignItems = 'center';
      ghostEl.style.justifyContent = 'center';
      ghostEl.style.overflow = 'hidden';
      ghostEl.style.textOverflow = 'ellipsis';
      ghostEl.style.whiteSpace = 'nowrap';
  
      ghostEl.style.left = `${info.jsEvent.clientX + 15}px`;
      ghostEl.style.top = `${info.jsEvent.clientY + 15}px`;
  
      document.body.appendChild(ghostEl);
      ghostElementRef.current = ghostEl;
  
      const updateGhostPosition = (e) => {
        if (ghostElementRef.current) {
          ghostElementRef.current.style.left = `${e.clientX + 15}px`;
          ghostElementRef.current.style.top = `${e.clientY + 15}px`;
          
          // Mettre à jour la surbrillance des zones de dépôt
          const taskBoardContainer = document.querySelector('.taskboard-container');
          const dropZoneElements = document.querySelectorAll('.potential-drop-target');
          let foundMatch = false;
          
          dropZoneElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isOver = e.clientX >= rect.left && 
                           e.clientX <= rect.right && 
                           e.clientY >= rect.top && 
                           e.clientY <= rect.bottom;
                           
            if (isOver) {
              el.classList.add('dropzone-active');
              foundMatch = true;
            } else {
              el.classList.remove('dropzone-active');
            }
          });
          
          if (taskBoardContainer && foundMatch) {
            taskBoardContainer.classList.add('taskboard-highlight-intense');
          } else if (taskBoardContainer) {
            taskBoardContainer.classList.remove('taskboard-highlight-intense');
          }
  
          // Effet de mise à l'échelle lors du déplacement
          ghostElementRef.current.style.transform = 'scale(1.05)';
          setTimeout(() => {
            if (ghostElementRef.current) {
              ghostElementRef.current.style.transform = 'scale(1)';
            }
          }, 50);
        }
      };
  
      document.addEventListener('mousemove', updateGhostPosition);
      window.ghostMoveHandler = updateGhostPosition;
  
      return updateGhostPosition;
    }, []);
  
    // Fin du glisser-déposer
    const handleEventDragStop = useCallback(async (info) => {
      // Nettoyer tous les effets visuels
      highlightTaskBoard(false);
      document.querySelectorAll('.potential-drop-target, .dropzone-active').forEach(el => {
        el.classList.remove('potential-drop-target');
        el.classList.remove('dropzone-active');
        el.classList.remove('active-drop-target');
      });
  
      if (window.ghostMoveHandler) {
        document.removeEventListener('mousemove', window.ghostMoveHandler);
        window.ghostMoveHandler = null;
      }
  
      if (info.el) {
        info.el.classList.remove('dragging-event');
        info.el.style.opacity = '1';
      }
  
      // Vérifier si l'événement est sur une zone de dépôt
      const eventPosition = {
        x: info.jsEvent.clientX,
        y: info.jsEvent.clientY
      };
  
      const dropTarget = isEventOverDropZone(eventPosition);
  
      if (dropTarget) {
        const { dropZone } = dropTarget;
        const taskId = info.event.id;
        const task = tasks.find(t => t.id.toString() === taskId.toString());
  
        if (!task) {
          console.warn(`Task with id ${taskId} not found`);
          return;
        }
  
        // Préparer l'événement et cacher l'original
        const customUpdates = {
          statusId: dropZone.statusId,
          ownerId: null,
        };
  
        if (info.el) info.el.style.display = 'none';
        info.event.remove();
  
        // Animer la transition vers le TaskBoard
        simulateImmediateAppearance(taskId, dropZone);
  
        // Préparer les mises à jour
        const updates = {
          resourceId: null,
          statusId: dropZone.statusId,
          extendedProps: {
            statusId: dropZone.statusId,
            ...customUpdates
          },
          title: task.title
        };
  
        // Mettre à jour l'état
        updateTaskStatus(taskId, updates);
  
        // Mise à jour sur le serveur
        try {
          await handleTaskUpdate(taskId, updates, { skipApiCall: false });
          toast.success(`Tâche déplacée vers ${dropZone.title || 'la colonne'}`, TOAST_CONFIG);
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la tâche:', error);
          toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);
        }
      }
    }, [tasks, updateTaskStatus, handleTaskUpdate, highlightTaskBoard, isEventOverDropZone, simulateImmediateAppearance]);
  
    // Dépôt d'une tâche externe sur le calendrier
    const handleExternalDrop = useCallback(async (info) => {
      if (info.draggedEl) {
        info.draggedEl.style.opacity = '0';
      }
  
      if (info.draggedEl.dataset.processed === 'true') {
        return;
      }
  
      info.draggedEl.dataset.processed = 'true';
  
      setTimeout(() => {
        if (info.draggedEl && info.draggedEl.dataset) {
          delete info.draggedEl.dataset.processed;
        }
      }, 100);
  
      if (!info.draggedEl.parentNode) return;
  
      const startDate = info.date || new Date();
      
      // Créer une date de fin inclusive (même jour que startDate par défaut)
      const inclusiveEndDate = new Date(startDate);
      
      // Créer une date de fin exclusive (jour suivant pour FullCalendar)
      const exclusiveEndDate = new Date(startDate.getTime() + 86400000);
  
      // Vérifier si c'est un jour férié ou un weekend
      if (DateUtils.isHolidayOrWeekend(startDate, holidays)) {
        toast.warning('Impossible de planifier sur un jour non ouvré', TOAST_CONFIG);
        if (info.draggedEl) {
          info.draggedEl.style.opacity = '1';
        }
        return;
      }
  
      // Vérifier si la ressource cible est une équipe
      if (info.resource && info.resource.extendedProps && info.resource.extendedProps.isTeam) {
        toast.warning('Impossible de planifier directement sur une équipe', TOAST_CONFIG);
        if (info.draggedEl) {
          info.draggedEl.style.opacity = '1';
        }
        return;
      }
  
      // Vérifier si l'ID de la ressource commence par "team_"
      if (info.resource && typeof info.resource.id === 'string' && info.resource.id.startsWith('team_')) {
        toast.warning('Impossible de planifier directement sur une équipe', TOAST_CONFIG);
        if (info.draggedEl) {
          info.draggedEl.style.opacity = '1';
        }
        return;
      }
  
      const taskId = info.draggedEl.getAttribute('data-task-id');
      const externalTask = tasks.find(task => task.id.toString() === taskId.toString());
  
      if (!externalTask) return false;
  
      const updates = {
        title: externalTask.title,
        description: externalTask.extendedProps?.description || '',
        start: startDate,
        end: exclusiveEndDate, // Date exclusive pour FullCalendar
        exclusiveEndDate: exclusiveEndDate, // Stocker explicitement la date exclusive
        resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
        extendedProps: {
          ...externalTask.extendedProps,
          statusId: '2', // S'assurer que statusId est dans extendedProps
          inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive dans extendedProps
        },
        statusId: '2' // Garder aussi au niveau racine pour compatibilité
      };
  
      // Mettre à jour la tâche avec les nouvelles propriétés
      updateTaskStatus(taskId, updates);
  
      // Au lieu de filtrer et supprimer la tâche, on va mettre à jour son affichage
      setTimeout(() => {
        setTasks(prev => {
          return prev.map(t => {
            if (t.id.toString() === taskId.toString()) {
              // On garde la tâche mais on met à jour son statusId
              return {
                ...t,
                resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
                start: startDate,
                end: exclusiveEndDate, // Date exclusive pour FullCalendar
                extendedProps: {
                  ...t.extendedProps,
                  statusId: '2',
                  inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive
                }
              };
            }
            return t;
          });
        });
  
        if (info.draggedEl) {
          info.draggedEl.style.opacity = '1';
        }
      }, 50);
  
      await handleTaskUpdate(
        taskId,
        updates,
        {
          successMessage: `Tâche "${externalTask.title}" droppée vers le calendrier`,
          skipApiCall: false
        }
      );
  
      return true;
    }, [holidays, tasks, updateTaskStatus, handleTaskUpdate, setTasks]);
  
    // Réception d'un événement externe
    const handleEventReceive = useCallback((info) => {
      if (info.event.extendedProps.processed) {
        return;
      }
      info.event.setExtendedProp('processed', true);
      info.event.remove();
    }, []);
  
    return {
      handleExternalTaskClick,
      handleEventDragStop,
      handleExternalDrop,
      handleEventReceive,
      createGhostElement // Exposer cette fonction si nécessaire
    };
  };