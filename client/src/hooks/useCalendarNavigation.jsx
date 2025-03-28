import { useCallback, useMemo } from 'react';

export const useCalendarNavigation = (calendarRef, selectedYear, setSelectedYear) => {
  // Mois en français pour les boutons
  const months = useMemo(() => [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ], []);

  // Fonction pour naviguer vers un mois spécifique avec dates UTC
const navigateToMonth = useCallback((monthIndex) => {
  if (!calendarRef.current) return;

  // Accéder directement à l'API du calendrier
  const calendarApi = calendarRef.current.getApi();

  // Obtenir l'année courante et la vue courante
  const year = selectedYear;
  const currentView = calendarApi.view.type;

  try {
    // Pour la vue semaine
    if (currentView === 'resourceTimelineWeek') {
      // Créer une date UTC pour le premier jour du mois
      const firstDayOfMonth = new Date(Date.UTC(year, monthIndex, 1));
      
      // Trouver le jour de la semaine (0=dimanche, 1=lundi, etc.)
      const dayOfWeek = firstDayOfMonth.getDay();
      
      // Calculer le lundi de la semaine
      let mondayDate;
      
      if (dayOfWeek === 1) {
        // Si c'est un lundi, utiliser cette date
        mondayDate = new Date(firstDayOfMonth);
      } else if (dayOfWeek === 0) {
        // Si c'est un dimanche, le lundi est le lendemain
        mondayDate = new Date(firstDayOfMonth);
        mondayDate.setUTCDate(mondayDate.getUTCDate() + 1);
      } else {
        // Pour les autres jours, reculer au lundi précédent
        const daysToSubtract = dayOfWeek - 1;
        mondayDate = new Date(firstDayOfMonth);
        mondayDate.setUTCDate(mondayDate.getUTCDate() - daysToSubtract);
      }
      
      // Si ce lundi est dans le mois précédent, chercher le premier lundi du mois
      if (mondayDate.getUTCMonth() !== monthIndex) {
        mondayDate = new Date(Date.UTC(year, monthIndex, 1));
        while (mondayDate.getUTCDay() !== 1) {
          mondayDate.setUTCDate(mondayDate.getUTCDate() + 1);
        }
      }
      
      // Force FullCalendar à cette date exacte
      const adjustedDateStr = mondayDate.toISOString().split('T')[0];
      
      calendarApi.gotoDate(adjustedDateStr);
    }
    // Pour la vue mois
    else if (currentView === 'resourceTimelineMonth') {
      // Créer une date pour le premier jour du mois en UTC
      const firstDayOfMonth = new Date(Date.UTC(year, monthIndex, 1));
      
      // Utiliser directement la chaîne de date ISO pour éviter les décalages
      const dateStr = firstDayOfMonth.toISOString().split('T')[0];
      
      calendarApi.gotoDate(dateStr);
    } 
    // Pour la vue année
    else if (currentView === 'resourceTimelineYear') {
      // Créer la date cible pour le premier jour du mois sélectionné
      const targetDate = new Date(Date.UTC(year, monthIndex, 1));
      
      // Pour les vues timeline, cette méthode est plus efficace que gotoDate
      calendarApi.scrollToTime({ 
        days: targetDate.getUTCDate() - 1, 
        months: targetDate.getUTCMonth(), 
        years: targetDate.getUTCFullYear() - calendarApi.getDate().getFullYear() 
      });
      
      // Amélioration pour le défilement visuel
      requestAnimationFrame(() => {
        const timelineBody = document.querySelector('.fc-timeline-body');
        if (timelineBody) {
          const headers = document.querySelectorAll('.fc-timeline-slot[data-date]');
          
          let targetHeader = null;
          headers.forEach(header => {
            const headerDate = new Date(header.getAttribute('data-date'));
            if (headerDate.getMonth() === monthIndex) {
              targetHeader = header;
            }
          });
          
          if (targetHeader) {
            const rect = targetHeader.getBoundingClientRect();
            const containerRect = timelineBody.getBoundingClientRect();
            
            const scrollLeft = rect.left + timelineBody.scrollLeft - containerRect.left - 
                             (containerRect.width / 2) + (rect.width / 2);
            
            timelineBody.scrollTo({
              left: scrollLeft,
              behavior: 'smooth'
            });
          }
        }
      }, 50);
    }
  } catch (error) {
    console.error("Erreur de navigation:", error);
    
    // Méthode de secours
    try {
      // Utiliser le format de chaîne de date pour éviter les décalages
      const fallbackDate = new Date(Date.UTC(year, monthIndex, 1));
      const dateStr = fallbackDate.toISOString().split('T')[0];
      
      calendarApi.gotoDate(dateStr);
    } catch (fallbackError) {
      console.error("Erreur de secours:", fallbackError);
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

    // Retourner la nouvelle date pour permettre la mise à jour du numéro de semaine
    return newDate;
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

    // Retourner la nouvelle date pour permettre la mise à jour du numéro de semaine
    return newDate;
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