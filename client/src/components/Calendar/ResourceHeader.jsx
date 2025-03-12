import React, { memo } from 'react';

export const ResourceHeader = memo(({ resource }) => {
  const isTeam = resource.extendedProps?.isTeam;
  
  const headerStyle = {
    padding: isTeam ? '8px 12px' : '8px 12px 8px 20px',
    fontWeight: isTeam ? 'bold' : 'normal',
    backgroundColor: isTeam ? '#e5e7eb' : 'transparent',
    borderBottom: isTeam ? '1px solid #d1d5db' : '1px solid #e5e7eb',
    color: isTeam ? '#1f2937' : '#4b5563',
    fontSize: isTeam ? '0.95rem' : '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };
  
  return (
    <div style={headerStyle}>
      <span>{resource.title}</span>
      {!isTeam && (
        <div className="resource-actions">
          {/* Ici vous pouvez ajouter des boutons d'action pour chaque ressource */}
          {/* Par exemple, un bouton pour voir les détails de la personne */}
        </div>
      )}
    </div>
  );
});