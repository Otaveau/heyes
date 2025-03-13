// calendarStyles.js

export function getEnhancedCalendarStyles() {
    return `
      /* Styles généraux pour la headerToolbar */
      .fc .fc-toolbar {
        background-color: #f8fafc;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
      }
      
      /* Styles pour les boutons standard */
      .fc .fc-button-primary {
        background-color: #f1f5f9;
        border-color: #cbd5e1;
        color: #475569;
        font-weight: 500;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.025em;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        padding: 6px 12px;
      }
      
      .fc .fc-button-primary:hover {
        background-color: #e2e8f0;
        border-color: #94a3b8;
        color: #334155;
        transform: translateY(-1px);
      }
      
      .fc .fc-button-primary:not(:disabled):active,
      .fc .fc-button-primary.fc-button-active {
        background-color: #3b82f6;
        border-color: #2563eb;
        color: #ffffff;
        font-weight: 600;
      }
      
      /* Styles pour les séparateurs de boutons */
      .fc .fc-button-group {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        overflow: hidden;
      }
      
      .fc .fc-button-group .fc-button-primary {
        border-radius: 0;
        border-right-width: 0;
      }
      
      .fc .fc-button-group .fc-button-primary:first-child {
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
      }
      
      .fc .fc-button-group .fc-button-primary:last-child {
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
        border-right-width: 1px;
      }
      
      /* Styles pour notre navigation personnalisée */
      .fc-custom-nav-container {
        margin-bottom: 16px;
        padding: 10px;
        background-color: #f8fafc;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .fc-nav-row {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }
      
      /* Section de navigation par année */
      .fc-year-nav {
        display: flex;
        align-items: center;
        gap: 5px;
        background-color: #f1f5f9;
        padding: 6px 10px;
        border-radius: 6px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      /* Affichage de l'année */
      .fc-year-display {
        margin: 0 8px;
        font-weight: 600;
        font-size: 1.1rem;
        min-width: 60px;
        text-align: center;
        color: #1e40af;
        user-select: none;
      }
      
      /* Boutons de navigation d'année */
      .fc-prev-year-button,
      .fc-next-year-button,
      .fc-today-button {
        font-size: 0.9rem;
        padding: 6px 12px !important;
        border-radius: 6px;
        transition: all 0.2s ease;
        background-color: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
      }
      
      .fc-prev-year-button:hover,
      .fc-next-year-button:hover,
      .fc-today-button:hover {
        background-color: #e2e8f0;
        border-color: #94a3b8;
        color: #334155;
        transform: translateY(-1px);
      }
      
      .fc-today-button {
        background-color: #3b82f6;
        border-color: #2563eb;
        color: #ffffff;
        font-weight: 500;
      }
      
      .fc-today-button:hover {
        background-color: #2563eb;
        border-color: #1d4ed8;
        color: #ffffff;
      }
      
      /* Section de navigation par mois */
      .fc-months-nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 5px;
        flex-grow: 1;
        transition: opacity 0.3s ease, height 0.3s ease;
      }
      
      /* Boutons des mois */
      .fc-month-button {
        font-size: 0.85rem;
        padding: 6px 10px !important;
        margin: 0;
        min-width: 80px;
        text-align: center;
        border-radius: 6px;
        transition: all 0.2s ease;
        position: relative;
        background-color: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
      }
      
      /* Gestion des versions abrégées/complètes des noms de mois */
      .fc-month-button .month-full {
        display: inline;
      }
      
      .fc-month-button .month-abbr {
        display: none;
      }
      
      /* Effets de survol et d'état actif */
      .fc-month-button:hover {
        background-color: #e2e8f0;
        border-color: #94a3b8;
        color: #334155;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .fc-month-button.fc-button-active {
        background-color: #3b82f6;
        border-color: #2563eb;
        color: #ffffff;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(29, 78, 216, 0.2);
      }
      
      /* Style pour ajouter un indicateur sous le mois actif */
      .fc-month-button.fc-button-active::after {
        content: '';
        position: absolute;
        bottom: -3px;
        left: 25%;
        width: 50%;
        height: 3px;
        border-radius: 3px;
        background-color: #1d4ed8;
      }
      
      /* Personnalisation des boutons de navigation de vue */
      .fc-resourceTimelineYear-button,
      .fc-resourceTimelineMonth-button,
      .fc-resourceTimelineWeek-button {
        text-transform: uppercase;
        letter-spacing: 0.025em;
        font-weight: 500;
        font-size: 0.85rem;
      }
      
      /* Indicateur visuel pour le bouton de vue active */
      .fc-button-active.fc-resourceTimelineYear-button,
      .fc-button-active.fc-resourceTimelineMonth-button,
      .fc-button-active.fc-resourceTimelineWeek-button {
        position: relative;
      }
      
      .fc-button-active.fc-resourceTimelineYear-button::after,
      .fc-button-active.fc-resourceTimelineMonth-button::after,
      .fc-button-active.fc-resourceTimelineWeek-button::after {
        content: '';
        position: absolute;
        bottom: -3px;
        left: 25%;
        width: 50%;
        height: 3px;
        border-radius: 3px;
        background-color: #1d4ed8;
      }
      
      /* Animation lors du clic sur un bouton */
      .fc-button-clicked {
        transform: scale(0.95);
        transition: transform 0.2s ease;
      }
      
      /* Amélioration du conteneur principal du calendrier */
      .fc {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
      }
      
      /* Style des en-têtes de colonne */
      .fc .fc-col-header-cell {
        background-color: #f8fafc;
        font-weight: 600;
      }
      
      .fc .fc-col-header-cell-cushion {
        padding: 8px 4px;
        color: #334155;
      }
      
      /* Style des cellules du calendrier */
      .fc .fc-daygrid-day {
        transition: background-color 0.15s ease;
      }
      
      .fc .fc-daygrid-day:hover {
        background-color: #f1f5f9;
      }
      
      /* Style des événements */
      .fc-event {
        border-radius: 4px;
        border: none;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        font-size: 0.85rem;
      }
      
      /* Style des cellules de week-end */
      .weekend-column {
        background-color: #f1f5f9 !important;
      }
      
      /* Style des jours fériés */
      .holiday-column {
        background-color: #fee2e2 !important;
      }
      
      /* Styles responsifs */
      @media (max-width: 992px) {
        .fc-nav-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        
        .fc-year-nav {
          width: 100%;
          justify-content: space-between;
        }
        
        .fc-months-nav {
          width: 100%;
          justify-content: flex-start;
        }
        
        .fc-month-button {
          min-width: 70px;
          padding: 5px 8px !important;
        }
      }
      
      @media (max-width: 768px) {
        .fc .fc-toolbar {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        
        .fc .fc-toolbar-chunk {
          margin-bottom: 8px;
          width: 100%;
        }
        
        .fc-month-button {
          min-width: 60px;
          font-size: 0.8rem;
        }
        
        .fc-year-display {
          font-size: 1.1rem;
          min-width: 50px;
        }
        
        .fc-prev-year-button,
        .fc-next-year-button,
        .fc-today-button {
          font-size: 0.8rem;
          padding: 5px 10px !important;
        }
      }
      
      @media (max-width: 640px) {
        .fc-month-button .month-full {
          display: none;
        }
        
        .fc-month-button .month-abbr {
          display: inline;
        }
        
        .fc-month-button {
          min-width: 45px;
          padding: 4px 6px !important;
        }
        
        .fc-today-button {
          font-size: 0.75rem;
          padding: 4px 8px !important;
        }
      }
      
      @media (max-width: 480px) {
        .fc-month-button {
          min-width: 40px;
          font-size: 0.75rem;
          padding: 3px 5px !important;
        }
        
        .fc-custom-nav-container {
          margin-bottom: 5px;
        }
        
        .fc-year-nav {
          gap: 2px;
        }
        
        .fc-year-display {
          font-size: 1rem;
          min-width: 40px;
          margin: 0 4px;
        }
      }
      
      /* Style spécifique pour la zone des ressources */
      .fc-resource-area {
        background-color: #f8fafc;
        border-right: 1px solid #e2e8f0;
      }
      
      .fc-resource-area .fc-datagrid-cell-main {
        padding: 8px 12px;
      }
      
      /* Style des lignes alternées pour une meilleure lisibilité */
      .fc-timeline-lane:nth-child(even) {
        background-color: #f8fafc;
      }
        
      .fc-month-button:focus {
        outline: none !important;
        box-shadow: none !important;
        }

        /* Style pour l'effet temporaire */
        .fc-month-button.fc-button-clicked {
        background-color: #4a5568;
        color: white;
        transform: scale(0.98);
        transition: all 0.2s ease;
        outline: none !important;
        box-shadow: none !important;
        }

    `;
}