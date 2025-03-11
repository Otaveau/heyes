/**
 * Utilitaires pour la gestion des styles de drag-and-drop
 * Ce module permet d'injecter et de gérer dynamiquement les styles CSS liés au drag-and-drop
 */

/**
 * Applique les styles nécessaires pour le glisser-déposer des tâches
 * Cette fonction injecte dynamiquement une feuille de style dans le head du document
 * @returns {void}
 */
export const applyDragDropStyles = () => {
    // Vérifier si les styles sont déjà ajoutés
    let styleElement = document.getElementById('drag-drop-styles');
    
    if (!styleElement) {
      // Créer un élément de style
      styleElement = document.createElement('style');
      styleElement.id = 'drag-drop-styles';
      styleElement.textContent = `
        /* Transitions fluides pour les éléments du TaskBoard */
        .fc-event {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
  
        .taskboard-highlight {
          box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.5), 0 0 15px rgba(74, 108, 247, 0.4);
          border-radius: 8px;
          animation: pulse-border 1.5s infinite ease-in-out;
          transition: all 0.15s ease-out;
        }
  
        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.5), 0 0 15px rgba(74, 108, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.6), 0 0 20px rgba(74, 108, 247, 0.5);
          }
          100% {
            box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.5), 0 0 15px rgba(74, 108, 247, 0.4);
          }
        }
        
        /* Élément fantôme */
        .task-ghost-element {
          font-weight: bold;
          border: 2px solid rgba(74, 108, 247, 0.7);
          transform-origin: center center;
        }
        
        /* Animation d'apparition dans le TaskBoard */
        .task-added {
          animation: taskAddedAnimation 0.5s ease-in-out;
        }
        
        /* Placeholder temporaire */
        .temporary-task-placeholder {
          background-color: rgba(74, 108, 247, 0.2);
          border: 2px dashed rgba(74, 108, 247, 0.7);
          border-radius: 4px;
          box-shadow: none;
        }
  
        /* Surbrillance intense quand on survole une zone valide */
        .taskboard-highlight-intense {
          box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.7), 0 0 20px rgba(74, 108, 247, 0.6);
        }
  
        /* Mise en surbrillance des zones de dépôt actives */
        .dropzone-active {
          background-color: rgba(74, 108, 247, 0.15) !important;
          border: 2px dashed #4a6cf7 !important;
          transform: scale(1.02);
          transition: all 0.15s ease-out;
        }
  
        /* Zone de dépôt potentielle */
        .potential-drop-target {
          background-color: rgba(230, 230, 250, 0.3);
          transition: background-color 0.3s ease;
          border: 1px dashed #ccc;
        }
        
        @keyframes taskAddedAnimation {
          0% { transform: scale(1); background-color: rgba(74, 108, 247, 0.4); }
          50% { transform: scale(1.1); background-color: rgba(74, 108, 247, 0.6); }
          100% { transform: scale(1); background-color: inherit; }
        }
      `;
      
      // Ajouter l'élément au head du document
      document.head.appendChild(styleElement);
    }
  };
  
  /**
   * Nettoie les styles de drag-and-drop lorsqu'ils ne sont plus nécessaires
   * @returns {void}
   */
  export const cleanupDragDropStyles = () => {
    const styleElement = document.getElementById('drag-drop-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
  };
  
  /**
   * Met en surbrillance le tableau de tâches (TaskBoard)
   * @param {boolean} isHighlighted - Indique si le tableau doit être en surbrillance
   */
  export const highlightTaskBoard = (isHighlighted) => {
    const taskBoardContainer = document.querySelector('.taskboard-container');
    if (taskBoardContainer) {
      if (isHighlighted) {
        taskBoardContainer.classList.add('taskboard-highlight');
      } else {
        taskBoardContainer.classList.remove('taskboard-highlight');
        taskBoardContainer.classList.remove('taskboard-highlight-intense');
      }
    }
  };
  
  /**
   * Nettoie toutes les surbrillances du TaskBoard et des zones de dépôt
   * @param {Array} dropZoneRefs - Références aux zones de dépôt
   */
  export const cleanupAllHighlights = (dropZoneRefs) => {
    const taskBoardContainer = document.querySelector('.taskboard-container');
    if (taskBoardContainer) {
      taskBoardContainer.classList.remove('taskboard-highlight');
      taskBoardContainer.classList.remove('taskboard-highlight-intense');
    }
    
    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach(ref => {
        if (ref?.current) {
          ref.current.classList.remove('dropzone-active');
          ref.current.classList.remove('potential-drop-target');
        }
      });
    }
  };
