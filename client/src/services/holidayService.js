export const fetchHolidays = async (year) => {
  try {
    const response = await fetch(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return Object.keys(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des jours fériés:', error);
    return [];
  }
};