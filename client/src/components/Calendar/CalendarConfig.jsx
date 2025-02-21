import frLocale from '@fullcalendar/core/locales/fr';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { isHoliday, isHolidayOrWeekend } from '../../utils/dateUtils';
import { ERROR_MESSAGES } from '../../constants/constants';

export const createCalendarOptions = ({
    resources,
    tasks,
    setTasks,
    statuses,
    showWeekends,
    setShowWeekends,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
    handleEventDrop,
    handleDrop,
    handleEventReceive,
    isProcessing
}) => {

    // Fonction utilitaire pour gérer la réception d'événements
    const handleEventReceiveWrapper = (info) => {
        if (!handleEventReceive || !info.event) return;

        try {
            const taskData = JSON.parse(info.draggedEl.dataset.event);
            handleEventReceive({
                ...info,
                taskData
            });
        } catch (error) {
            console.error(ERROR_MESSAGES.EVENT_RECEIVE, error);
        }
    };

    // Fonction utilitaire pour gérer le drop d'événements
    const handleDropWrapper = (info) => {

        try {
            const taskData = JSON.parse(info.draggedEl.dataset.event);
            info.draggedEl.style.opacity = '1';
            if (handleDrop) {
                handleDrop({
                    ...info,
                    taskData
                });
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.DROP_HANDLER, error);
        }
        return false;
    };

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
        editable: !isProcessing,
        droppable: true,
        eventStartEditable: !isProcessing,
        eventDurationEditable: !isProcessing,
        eventResourceEditable: !isProcessing,
        eventResizableFromStart: !isProcessing,
        selectable: !isProcessing,

        dropAccept: '.task-card',
        selectMirror: true,
        dropOverflow: true,
        eventOverlap: true,
        dragRevertDuration: 0,

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
        eventAllow: () => !isProcessing,
        eventDragStart: (info) => {
            info.el.style.opacity = '0.7';
        },

        eventDragStop: (info) => {
            info.el.style.opacity = '1';
        },
        eventReceive: handleEventReceiveWrapper,

        drop: handleDropWrapper,
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