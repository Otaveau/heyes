import React, { useState } from 'react';

// Composant temporaire simplifié pour le déploiement
export default function CalendarView() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulation de chargement pour tester le déploiement
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-3">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Calendrier</h1>
      <p>Le calendrier est en cours de maintenance. Veuillez réessayer plus tard.</p>
    </div>
  );
}