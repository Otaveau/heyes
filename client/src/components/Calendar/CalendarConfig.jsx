import frLocale from '@fullcalendar/core/locales/fr';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { isHoliday, isHolidayOrWeekend } from '../../utils/dateUtils';


export const createCalendarOptions = ({
    resources,
    tasks,
    showWeekends,
    setShowWeekends,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop,
    isProcessing
}) => {

    return {
        locale: frLocale,
        schedulerLicenseKey: "GPL-My-Project-Is-Open-Source",
        height: "auto",
        plugins: [
            resourceTimelinePlugin, 
            interactionPlugin, 
            dayGridPlugin, 
            timeGridPlugin
        ],
        initialView: 'resourceTimelineYear',
    eventStartEditable: !isProcessing,
    eventDurationEditable: !isProcessing,
    eventResizableFromStart: !isProcessing,
    editable: !isProcessing,
    droppable: !isProcessing,
    dropAccept: '.task-card',
    selectable: !isProcessing,
    selectMirror: true,
    select: handleDateSelect,
        resourceAreaWidth: '20%',
        resources,
        events: tasks.map(task => ({
            id: task.id?.toString(),
            title: task.title || 'Tâche sans titre',
            start: task.start || task.startDate,
            end: task.end || task.endDate || task.start,
            resourceId: task.resourceId || task.owner_id || null,
            allDay: true, // Forcer les événements à être sur toute la journée
            extendedProps: {
              description: task.description || '',
              status: task.status,
              statusId: task.statusId,
              originalTask: { ...task }
            }
          })),
        slotDuration: { days: 1 },
        defaultAllDay: true,
        forceEventDuration: true,
        eventClick: handleEventClick,
        eventResize: handleEventResize,
        eventDrop: handleEventDrop,
    dragRevertDuration: 0,
    eventOverlap: true,
    eventAllow: () => !isProcessing,
        eventDragStart: (info) => {
            info.el.style.opacity = '0.7';
        },
        
        eventDragStop: (info) => {
            info.el.style.opacity = '1';
        },
        drop: (dropInfo) => {
            try {
                const taskId = dropInfo.draggedEl.getAttribute('data-task-id');
                if (!taskId) {
                    console.warn('Aucun ID de tâche trouvé');
                    return;
                }
        
                const taskData = tasks.find(t => t.id.toString() === taskId);
                if (!taskData) {
                    console.warn('Tâche non trouvée:', taskId);
                    return;
                }
        
                const event = {
                    id: taskId,
                    title: taskData.title,
                    start: dropInfo.date,
                    end: dropInfo.date,
                    resourceId: dropInfo.resource?.id,
                    extendedProps: {
                        description: taskData.description,
                        source: 'backlog',
                        statusId: taskData.statusId,
                        originalTask: taskData
                    }
                };
        
                const calendarApi = dropInfo.view.calendar;
                calendarApi.addEvent(event);
                return false;
            } catch (error) {
                console.error('Erreur de gestion du drop:', error);
            }
        },
        eventReceive: (info) => {
            try {
                const taskId = info.draggedEl.getAttribute('data-task-id');
                if (!taskId || info.event.extendedProps?.isProcessing) {
                    return;
                }
        
                const taskData = tasks.find(t => t.id.toString() === taskId);
                if (!taskData) {
                    console.warn('Tâche non trouvée:', taskId);
                    return;
                }
        
                // Supprimer tous les événements existants avec le même ID
                const calendarApi = info.view.calendar;
                const existingEvents = calendarApi.getEvents();
                existingEvents.forEach(event => {
                    if (event.id === taskId && event !== info.event) {
                        event.remove();
                    }
                });
        
                // Marquer l'événement comme en cours de traitement
                info.event.setExtendedProp('isProcessing', true);
        
                // Mettre à jour l'événement avec toutes les données nécessaires
                info.event.setExtendedProp('source', 'backlog');
                info.event.setExtendedProp('statusId', taskData.statusId);
                info.event.setExtendedProp('description', taskData.description);
                info.event.setExtendedProp('originalTask', taskData);
        
                handleEventDrop({
                    event: info.event,
                    draggedEl: info.draggedEl
                });
            } catch (error) {
                console.error('Erreur dans eventReceive:', error);
                if (info.event) {
                    info.revert();
                }
            }
        },
        headerToolbar: {
            left: 'toggleWeekends',
            center: 'title',
            right: 'prev,next today'
        },
        customButtons: {
            toggleWeekends: {
                text: 'Afficher/Masquer weekends',
                click: () => setShowWeekends(!showWeekends)
            }
        },
        slotLabelFormat: [
            { month: 'long', year: 'numeric' },
            { weekday: 'short', day: 'numeric' }
        ],
        slotLabelClassNames: (arg) => {
            if (!arg?.date) return [];
            const classes = [];
            if (arg.level === 1 && isHolidayOrWeekend(arg.date, holidays)) {
                classes.push(isHoliday(arg.date, holidays) ? 'holiday-slot' : 'weekend-slot');
            }
            return classes;
        },
        slotLaneClassNames: (arg) => {
            if (!arg?.date) return '';
            return isHolidayOrWeekend(arg.date, holidays)
                ? isHoliday(arg.date, holidays) 
                    ? 'holiday-column' 
                    : 'weekend-column'
                : '';
        }
    };
};