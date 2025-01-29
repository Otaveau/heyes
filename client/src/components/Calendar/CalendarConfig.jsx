import frLocale from '@fullcalendar/core/locales/fr';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

export const createCalendarOptions = ({
    resources,
    tasks,
    showWeekends,
    setShowWeekends,
    holidays,
    handleDateSelect,
    handleEventResize,
    handleEventClick,
}) => {

    const isHoliday = (date) => {
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        const dateStr = localDate.toISOString().split('T')[0];
        return holidays.includes(dateStr);
    };

    const isHolidayOrWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6 || isHoliday(date);
    };

    return {
        locale: frLocale,
        schedulerLicenseKey: "GPL-My-Project-Is-Open-Source",
        height: "auto",
        plugins: [resourceTimelinePlugin, interactionPlugin, dayGridPlugin, timeGridPlugin],
        initialView: 'resourceTimelineYear',
        eventStartEditable: true,
        eventDurationEditable: true, 
        eventResizableFromStart: true,
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
            const classes = [];
            if (arg.level === 1 && isHolidayOrWeekend(arg.date)) {
                classes.push(isHoliday(arg.date) ? 'holiday-slot' : 'weekend-slot');
            }
            return classes;
        },
        slotLaneClassNames: (arg) => {
            if (isHolidayOrWeekend(arg.date)) {
                return isHoliday(arg.date) ? 'holiday-column' : 'weekend-column';
            }
            return '';
        },
        resourceLabelClassNames: 'resource-label',
        weekends: showWeekends,
        editable: true,
        droppable: true,
        selectable: true,
        selectMirror: true,
        select: handleDateSelect,
        resourceAreaWidth: '20%',
        resources,
        events: tasks,
        eventClick: handleEventClick, // Ajout de l'option eventClick   // Pour la sélection de dates
        eventResize: handleEventResize,
        eventConstraint: {
            startTime: '00:00',
            endTime: '24:00',
            dows: [1, 2, 3, 4, 5]
        },
    };
};