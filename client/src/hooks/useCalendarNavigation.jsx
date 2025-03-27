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

    // Obtenir la vue actuelle
    const currentView = calendarApi.view.type;

    try {
      // D'abord, naviguer à la date cible selon la vue
      calendarApi.gotoDate(targetDate);

      // Pour la vue année, faire défiler jusqu'au mois sélectionné
      if (currentView === 'resourceTimelineYear') {
        // Pour les vues timeline, cette méthode est plus efficace que gotoDate seul
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
      // Pour la vue mois, on est déjà au bon endroit grâce à gotoDate
      else if (currentView === 'resourceTimelineMonth') {
        // Rien de plus à faire, gotoDate a déjà navigué au bon mois
      }
      // Pour la vue semaine, ajuster pour commencer à la première semaine du mois
      else if (currentView === 'resourceTimelineWeek') {
        // Trouver le premier jour de la semaine (lundi en France)
        const firstDay = new Date(year, monthIndex, 1);
        const dayOfWeek = firstDay.getDay(); // 0 = dimanche, 1 = lundi, ...

        // Calculer le lundi de la première semaine du mois
        // Si le 1er du mois est un lundi (1), on garde cette date
        // Sinon, on recule jusqu'au lundi précédent
        let mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
        const firstMonday = new Date(year, monthIndex, 1 + mondayOffset);

        // Si le lundi est dans le mois précédent et qu'il y a un lundi dans ce mois, avancer à celui-ci
        if (firstMonday.getMonth() !== monthIndex) {
          // Trouver le premier lundi du mois
          mondayOffset = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
          const firstMondayInMonth = new Date(year, monthIndex, 1 + mondayOffset);
          calendarApi.gotoDate(firstMondayInMonth);
        } else {
          calendarApi.gotoDate(firstMonday);
        }
      }
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