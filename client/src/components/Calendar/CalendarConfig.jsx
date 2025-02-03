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
    handleEventDrop
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
        eventStartEditable: true,
        eventDurationEditable: true,
        eventResizableFromStart: true,
        resourceLabelClassNames: 'resource-label',
        weekends: showWeekends,
        editable: true,
        droppable: true,
        dropAccept: '.task-card',
        selectable: true,
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
        eventDrop: (info) => {
            console.log('Event dropped:', info);
            handleEventDrop(info);
        },
        dragRevertDuration: 0,
        eventOverlap: true, // Permet le chevauchement d'événements
        eventAllow: () => true, // Permet tous les événements
        eventDragStart: (info) => {
            info.el.style.opacity = '0.7';
        },
        
        eventDragStop: (info) => {
            info.el.style.opacity = '1';
        },
        drop: (dropInfo) => {
            try {
                const rawData = dropInfo.draggedEl.dataset.event;
                console.debug('Données de drop brutes:', rawData);
                
                const taskData = rawData ? JSON.parse(rawData) : null;
                if (!taskData) {
                    console.warn('Aucune donnée de tâche trouvée');
                    return;
                }
                
                const event = {
                    title: taskData.title || 'Nouvelle tâche',
                    start: dropInfo.date,
                    end: dropInfo.date,
                    resourceId: dropInfo.resource?.id,
                    extendedProps: {
                        description: taskData.description || '',
                        source: 'backlog',
                        statusId: taskData.statusId
                    }
                };
                
                const calendarApi = dropInfo.view.calendar;
                calendarApi.addEvent(event);
            } catch (error) {
                console.error('Erreur de gestion du drop:', error);
            }
        },
        eventReceive: (info) => {
            console.log('Event received:', info);
            if (info.event.extendedProps?.source === 'backlog') {
                handleEventDrop({ event: info.event });
            }
        },
        eventConstraint: {
            startTime: '00:00',
            endTime: '24:00'
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
            {
                month: 'long',
                year: 'numeric',
                className: 'month-header'
            },
            {
                weekday: 'short',
                day: 'numeric',
                className: 'day-header'
            }
        ],
        slotLabelClassNames: (arg) => {
            if (!arg || !arg.date) return [];
            const classes = [];
            if (arg.level === 1 && isHolidayOrWeekend(arg.date, holidays)) {
                classes.push(isHoliday(arg.date, holidays) ? 'holiday-slot' : 'weekend-slot');
            }
            return classes;
        },
        
        slotLaneClassNames: (arg) => {
            if (!arg || !arg.date) return '';
            if (isHolidayOrWeekend(arg.date, holidays)) {
                return isHoliday(arg.date, holidays) ? 'holiday-column' : 'weekend-column';
            }
            return '';
        },
    };
};