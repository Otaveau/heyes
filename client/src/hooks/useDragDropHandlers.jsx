import { useCallback, useRef, useEffect } from 'react';
import {
  applyDragDropStyles,
  cleanupAllHighlights
} from '../utils/dndUtils';


export const useDragDropHandlers = (dropZoneRefs, dropZones) => {
    // Références pour les effets visuels
    const ghostElementRef = useRef(null);
    const dropTimeoutRef = useRef(null);
  
    // Appliquer les styles nécessaires au chargement
    useEffect(() => {
      // Injecter les styles CSS
      applyDragDropStyles();
  
      // Nettoyage au démontage
      return () => {
        cleanupAllHighlights(dropZoneRefs);
        if (ghostElementRef.current) {
          document.body.removeChild(ghostElementRef.current);
          ghostElementRef.current = null;
        }
      };
    }, [dropZoneRefs]);
  
    // Gérer l'annulation du drag par touche Echap ou clic en dehors
    useEffect(() => {
      const handleDragCancel = () => {
        if (ghostElementRef.current) {
          if (ghostElementRef.current) {
            document.body.removeChild(ghostElementRef.current);
            ghostElementRef.current = null;
          }
          cleanupAllHighlights(dropZoneRefs);
          if (window.ghostMoveHandler) {
            document.removeEventListener('mousemove', window.ghostMoveHandler);
            window.ghostMoveHandler = null;
          }
        }
      };
  
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') handleDragCancel();
      };
  
      const handleMouseUp = () => {
        setTimeout(() => {
          if (ghostElementRef.current) {
            handleDragCancel();
          }
        }, 100);
      };
  
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mouseup', handleMouseUp);
  
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [dropZoneRefs]);
  
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
  
    // Mettre à jour la surbrillance des zones de dépôt pendant le déplacement
    const highlightDropZonesOnDrag = useCallback((event) => {
      if (!ghostElementRef.current) return;
  
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      let foundMatch = false;
  
      if (dropZoneRefs?.current) {
        dropZoneRefs.current.forEach(ref => {
          if (!ref?.current) return;
  
          const dropZoneEl = ref.current;
          const rect = dropZoneEl.getBoundingClientRect();
  
          const isOver =
            mouseX >= rect.left &&
            mouseX <= rect.right &&
            mouseY >= rect.top &&
            mouseY <= rect.bottom;
  
          if (isOver) {
            dropZoneEl.classList.add('dropzone-active');
            foundMatch = true;
          } else {
            dropZoneEl.classList.remove('dropzone-active');
          }
        });
      }
  
      const taskBoardContainer = document.querySelector('.taskboard-container');
      if (taskBoardContainer && foundMatch) {
        taskBoardContainer.classList.add('taskboard-highlight-intense');
      } else if (taskBoardContainer) {
        taskBoardContainer.classList.remove('taskboard-highlight-intense');
      }
    }, [dropZoneRefs]);
  
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
  
          highlightDropZonesOnDrag(e);
  
          ghostElementRef.current.style.transform = 'scale(1.05)';
  
          clearTimeout(dropTimeoutRef.current);
          dropTimeoutRef.current = setTimeout(() => {
            if (ghostElementRef.current) {
              ghostElementRef.current.style.transform = 'scale(1)';
            }
          }, 50);
        }
      };
  
      document.addEventListener('mousemove', updateGhostPosition);
      window.ghostMoveHandler = updateGhostPosition;
  
      return updateGhostPosition;
    }, [highlightDropZonesOnDrag]);
  
    // Animation de transition vers le TaskBoard
    const simulateImmediateAppearance = useCallback((taskId, targetDropZone) => {
      const dropZoneIndex = dropZones.findIndex(dz => dz.id === targetDropZone.id);
      const dropZoneRef = dropZoneRefs.current[dropZoneIndex];
  
      if (!dropZoneRef || !dropZoneRef.current || !ghostElementRef.current) return;
  
      const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
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
  
      dropZoneRef.current.appendChild(placeholderTask);
  
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
          }
        }, 200);
      }, 180);
    }, [dropZones, dropZoneRefs]);
  
    // Vérifier si un événement est au-dessus d'une zone de dépôt
    const isEventOverDropZone = useCallback((eventPosition) => {
      if (!dropZoneRefs?.current) return null;
  
      // Réinitialiser les styles de toutes les zones
      dropZoneRefs.current.forEach(ref => {
        if (ref?.current) ref.current.classList.remove('active-drop-target');
      });
  
      // Vérifier chaque zone
      for (let index = 0; index < dropZoneRefs.current.length; index++) {
        const ref = dropZoneRefs.current[index];
        if (!ref?.current) continue;
  
        const dropZoneEl = ref.current;
        const rect = dropZoneEl.getBoundingClientRect();
  
        if (eventPosition.x >= rect.left &&
          eventPosition.x <= rect.right &&
          eventPosition.y >= rect.top &&
          eventPosition.y <= rect.bottom) {
  
          dropZoneEl.classList.add('active-drop-target');
          return { dropZone: dropZones[index] };
        }
      }
  
      return null;
    }, [dropZoneRefs, dropZones]);
  
    // Début du glisser-déposer
    const handleEventDragStart = useCallback((info) => {
      highlightTaskBoard(true);
  
      createGhostElement(info);
  
      if (info.el) {
        info.el.style.opacity = '0';
      }
  
      if (dropZoneRefs?.current) {
        dropZoneRefs.current.forEach(ref => {
          if (ref?.current) {
            ref.current.classList.add('potential-drop-target');
          }
        });
      }
    }, [createGhostElement, dropZoneRefs, highlightTaskBoard]);
  
    // Préparation d'un événement pour le TaskBoard
    const prepareEventForTaskBoard = useCallback((event, targetDropZone) => {
      return {
        statusId: targetDropZone.statusId,
        ownerId: null,
      };
    }, []);
  
    return {
      highlightTaskBoard,
      createGhostElement,
      simulateImmediateAppearance,
      isEventOverDropZone,
      handleEventDragStart,
      prepareEventForTaskBoard
    };
  };