import { useCallback, useMemo } from 'react';

export const useCalendarNavigation = (calendarRef, selectedYear, setSelectedYear) => {
  // Mois en français pour les boutons
  const months = useMemo(() => [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ], []);

  // Fonction pour naviguer vers un mois spécifique
  const navigateToMonth = useCallback((monthIndex) => {
    if (!calendarRef.current) return;
    
    // Accéder directement à l'API du calendrier
    const calendarApi = calendarRef.current.getApi();
    
    // Obtenir l'année courante
    const year = selectedYear;
    
    // Créer la date cible pour le premier jour du mois sélectionné
    const targetDate = new Date(year, monthIndex, 1);
    
    try {
      // Pour les vues timeline, cette méthode est plus efficace que gotoDate
      calendarApi.scrollToTime({ 
        days: targetDate.getDate() - 1, 
        months: targetDate.getMonth(), 
        years: targetDate.getFullYear() - calendarApi.getDate().getFullYear() 
      });
      
      // Amélioration: Utiliser requestAnimationFrame pour assurer que le DOM est prêt
      requestAnimationFrame(() => {
        const timelineBody = document.querySelector('.fc-timeline-body');
        if (timelineBody) {
          // Trouver tous les éléments d'en-tête de mois
          const headers = document.querySelectorAll('.fc-timeline-slot[data-date]');
          
          // Trouver l'élément correspondant au mois sélectionné
          let targetHeader = null;
          headers.forEach(header => {
            const headerDate = new Date(header.getAttribute('data-date'));
            if (headerDate.getMonth() === monthIndex) {
              targetHeader = header;
            }
          });
          
          // Si on a trouvé l'en-tête correspondant, faire défiler jusqu'à lui
          if (targetHeader) {
            const rect = targetHeader.getBoundingClientRect();
            const containerRect = timelineBody.getBoundingClientRect();
            
            // Calculer la position de défilement pour centrer l'élément
            const scrollLeft = rect.left + timelineBody.scrollLeft - containerRect.left - 
                              (containerRect.width / 2) + (rect.width / 2);
            
            // Animer le défilement
            timelineBody.scrollTo({
              left: scrollLeft,
              behavior: 'smooth'
            });
          }
        }
      }, 50);
    } catch (error) {
      console.error("Navigation error:", error);
      
      // Méthode de secours
      try {
        calendarApi.gotoDate(targetDate);
      } catch (fallbackError) {
        console.error("Fallback navigation error:", fallbackError);
      }
    }
  }, [calendarRef, selectedYear]);

  // Fonctions pour la navigation entre les années
  const goToPreviousYear = useCallback(() => {
    setSelectedYear(prev => prev - 1);
    
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentDate = calendarApi.getDate();
      const newDate = new Date(currentDate);
      newDate.setFullYear(currentDate.getFullYear() - 1);
      calendarApi.gotoDate(newDate);
    }
  }, [calendarRef, setSelectedYear]);
  
  const goToNextYear = useCallback(() => {
    setSelectedYear(prev => prev + 1);
    
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentDate = calendarApi.getDate();
      const newDate = new Date(currentDate);
      newDate.setFullYear(currentDate.getFullYear() + 1);
      calendarApi.gotoDate(newDate);
    }
  }, [calendarRef, setSelectedYear]);

  // Gestionnaire pour les changements de vue du calendrier
  const handleViewChange = useCallback((viewInfo) => {
    // À compléter selon les besoins
  }, []);

  return {
    navigateToMonth,
    goToPreviousYear,
    goToNextYear,
    handleViewChange,
    months
  };
};