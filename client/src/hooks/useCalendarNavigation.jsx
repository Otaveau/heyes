import { useCallback, useMemo } from 'react';

export const useCalendarNavigation = (calendarRef, selectedYear, setSelectedYear) => {
  // Mois en français pour les boutons
  const months = useMemo(() => [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ], []);

  // Fonction pour naviguer vers un mois spécifique
  // Fonction pour naviguer vers un mois spécifique
const navigateToMonth = useCallback((monthIndex) => {
  if (!calendarRef.current) return;
  
  // Accéder directement à l'API du calendrier
  const calendarApi = calendarRef.current.getApi();
  
  // Obtenir l'année courante et la vue courante
  const year = selectedYear;
  const currentView = calendarApi.view.type;
  
  try {
    // Pour la vue semaine, naviguer à la première semaine du mois
    if (currentView === 'resourceTimelineWeek') {
      // Créer une date pour le premier jour du mois
      const firstDayOfMonth = new Date(year, monthIndex, 1);
      
      // Trouver le premier jour de la semaine (lundi en France)
      const dayOfWeek = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, ...
      
      // Créer une date pour le premier lundi du mois ou pour le lundi qui précède si le 1er est après lundi
      // Si le premier jour est un dimanche (0), alors le lundi est le jour suivant (+1)
      // Si le premier jour est un lundi (1), on garde le même jour (+0)
      // Si le premier jour est après lundi (2-6), on recule jusqu'au lundi précédent (-(dayOfWeek-1))
      const daysToAdjust = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : -(dayOfWeek - 1));
      
      // Calculer la date du lundi de la première semaine contenant un jour du mois
      const firstMondayDate = new Date(year, monthIndex, 1 + daysToAdjust);
      
      // Si le lundi calculé est dans le mois précédent et qu'on veut vraiment la première semaine du mois
      if (firstMondayDate.getMonth() !== monthIndex) {
        // Option 1: Utiliser le premier lundi qui tombe dans le mois
        const firstMondayInMonth = new Date(year, monthIndex, 1 + (8 - dayOfWeek) % 7);
        calendarApi.gotoDate(firstMondayInMonth);
      } else {
        // Le lundi calculé est déjà dans le mois cible ou c'est le lundi avant le premier jour du mois
        calendarApi.gotoDate(firstMondayDate);
      }
    }
    // Pour la vue mois, simplement aller au premier jour du mois
    else if (currentView === 'resourceTimelineMonth') {
      const firstDayOfMonth = new Date(year, monthIndex, 1);
      calendarApi.gotoDate(firstDayOfMonth);
    } 
    // Pour la vue année, conserver la logique existante
    else if (currentView === 'resourceTimelineYear') {
      // Créer la date cible pour le premier jour du mois sélectionné
      const targetDate = new Date(year, monthIndex, 1);
      
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
    }
  } catch (error) {
    console.error("Navigation error:", error);
    
    // Méthode de secours en cas d'erreur
    try {
      const targetDate = new Date(year, monthIndex, 1);
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

  // Fonction pour naviguer à la semaine précédente
  const goToPreviousWeek = useCallback(() => {
    if (!calendarRef.current) return;

    const calendarApi = calendarRef.current.getApi();

    // Obtenir la date actuelle du calendrier
    const currentDate = calendarApi.getDate();

    // Créer une nouvelle date 7 jours avant
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);

    // Naviguer à la nouvelle date
    calendarApi.gotoDate(newDate);
  }, [calendarRef]);

  // Fonction pour naviguer à la semaine suivante
  const goToNextWeek = useCallback(() => {
    if (!calendarRef.current) return;

    const calendarApi = calendarRef.current.getApi();

    // Obtenir la date actuelle du calendrier
    const currentDate = calendarApi.getDate();

    // Créer une nouvelle date 7 jours après
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);

    // Naviguer à la nouvelle date
    calendarApi.gotoDate(newDate);
  }, [calendarRef]);

  // Gestionnaire pour les changements de vue du calendrier
  const handleViewChange = useCallback((viewInfo) => {
    // À compléter selon les besoins
  }, []);

  return {
    navigateToMonth,
    goToPreviousYear,
    goToNextYear,
    goToPreviousWeek,
    goToNextWeek,
    handleViewChange,
    months
  };
};