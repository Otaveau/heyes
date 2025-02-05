import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';

export const CalendarView = () => {
  const [events, setEvents] = useState([
    { id: '1', title: 'Événement existant', start: '2024-02-05' }
  ]);
  const externalEventsRef = useRef(null);

  useEffect(() => {
    // Initialiser Draggable sur le conteneur d'événements externes
    new Draggable(externalEventsRef.current, {
      itemSelector: '.fc-event',
      eventData: function(eventEl) {
        return {
          title: eventEl.innerText
        };
      }
    });
  }, []);

  const handleEventDrop = (dropInfo) => {
    const { event } = dropInfo;
    setEvents(prevEvents => prevEvents.map(ev => 
      ev.id === event.id ? { ...ev, start: event.start, end: event.end } : ev
    ));
  };

  const handleExternalDrop = (info) => {
    if (info.draggedEl.parentNode === externalEventsRef.current) {
      setEvents(prev => [...prev, {
        id: `new-${Date.now()}`,
        title: info.draggedEl.innerText,
        start: info.dateStr,
        allDay: info.allDay
      }]);
      // Supprimer l'élément DOM pour éviter la duplication
      info.draggedEl.parentNode.removeChild(info.draggedEl);
    }
  };

  return (
    <div className="flex">
      <div 
        ref={externalEventsRef}
        className="w-48 p-4 bg-gray-100"
      >
        <h3 className="mb-4 font-bold">Événements disponibles</h3>
        <div className="fc-event p-2 mb-2 bg-white border rounded">Réunion</div>
        <div className="fc-event p-2 mb-2 bg-white border rounded">Formation</div>
        <div className="fc-event p-2 mb-2 bg-white border rounded">Pause déjeuner</div>
      </div>

      <div className="flex-1 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          editable={true}
          droppable={true}
          events={events}
          eventDrop={handleEventDrop}
          drop={handleExternalDrop}
        />
      </div>
    </div>
  );
};
