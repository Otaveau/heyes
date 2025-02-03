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

    console.log('Calendar Options - Resources:', resources);
    console.log('Calendar Options - Tasks:', tasks);

    return {
        locale: frLocale,
        schedulerLicenseKey: "GPL-My-Project-Is-Open-Source",
        height: "auto",
        plugins: [resourceTimelinePlugin, interactionPlugin, dayGridPlugin, timeGridPlugin],
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
            id: task.id, // Assurez-vous d'inclure l'ID de la tâche
            title: task.title,
            start: task.start, // Utilisez start au lieu de start_date
            end: task.end, // Utilisez end au lieu de end_date
            resourceId: task.resourceId || task.owner_id,
            extendedProps: {
                description: task.description || '',
                status: task.status, // Ajoutez le statut si disponible
                statusId: task.statusId
            }
        })),
        eventClick: handleEventClick, // Ajout de l'option eventClick   // Pour la sélection de dates
        eventResize: handleEventResize,
        eventDrop: handleEventDrop,
        dragRevertDuration: 0,
        eventOverlap: true, // Permet le chevauchement d'événements
        eventAllow: () => true, // Permet tous les événements
        eventDragStart: function (info) {
            console.log('Calendar: Event drag start', info.event);
        },
        eventDragStop: function (info) {
            console.log('Calendar: Event drag stop', info.event);
        },
        drop: (dropInfo) => {
            console.log('Calendar drop:', dropInfo);
            try {
                const taskData = JSON.parse(dropInfo.draggedEl.dataset.event);
                console.log('Parsed task data:', taskData);
                
                // Créer un nouvel événement à partir des données
                const event = {
                    title: taskData.title,
                    start: dropInfo.date,
                    end: dropInfo.date,
                    resourceId: dropInfo.resource?.id,
                    extendedProps: {
                        description: taskData.description,
                        source: 'backlog',
                        statusId: taskData.statusId
                    }
                };
                
                // Ajouter l'événement au calendrier
                const calendarApi = dropInfo.view.calendar;
                calendarApi.addEvent(event);
            } catch (error) {
                console.error('Error handling drop:', error);
            }
        },
        eventReceive: (info) => {
            console.log('Calendar eventReceive:', info);
            handleEventDrop({ event: info.event });
        },
        eventConstraint: {
            startTime: '00:00',
            endTime: '24:00',
            dows: [1, 2, 3, 4, 5]
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