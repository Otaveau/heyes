import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';

export const CalendarView = () => {
  const [events, setEvents] = useState([
    { id: '1', title: 'Événement existant', start: '2024-02-05', resourceId: 'resource1' }
  ]);

  const [resources] = useState([
    { id: 'resource1', title: 'Resource 1' },
    { id: 'resource2', title: 'Resource 2' },
  ]);

  const externalEventsRef = useRef(null);

  useEffect(() => {
    new Draggable(externalEventsRef.current, {
      itemSelector: '.fc-event',
      eventData: function(eventEl) {
        return {
          title: eventEl.innerText,
          resourceId: 'resource1' // resource par défaut
        };
      }
    });
  }, []);

  const handleEventDrop = (dropInfo) => {
    const { event } = dropInfo;
    setEvents(prevEvents => prevEvents.map(ev => 
      ev.id === event.id ? { 
        ...ev, 
        start: event.start, 
        end: event.end,
        resourceId: event.getResources()[0]?.id || 'resource1'
      } : ev
    ));
  };

  const handleExternalDrop = (info) => {
    if (info.draggedEl.parentNode === externalEventsRef.current) {
      setEvents(prev => [...prev, {
        id: `new-${Date.now()}`,
        title: info.draggedEl.innerText,
        start: info.dateStr,
        allDay: info.allDay,
        resourceId: info.resource?.id || 'resource1'
      }]);
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

      <div className="flex-1 p-4" style={{ width: '2000px' }}>
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          height='auto'
          schedulerLicenseKey= 'GPL-My-Project-Is-Open-Source'
          initialView="resourceTimelineYear"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineYear,resourceTimelineMonth,resourceTimelineWeek'
          }}
          editable={true}
          droppable={true}
          events={events}
          resources={resources}
          resourceAreaWidth="15%"
          slotDuration={{ days: 1 }}
          eventDrop={handleEventDrop}
          drop={handleExternalDrop}
        />
      </div>
    </div>
  );
};

