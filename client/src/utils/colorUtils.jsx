import { TEAM_BASE_COLORS } from '../constants/constants';


/**
 * Génère une couleur constante pour une équipe basée sur son ID
 */
export const getTeamColor = (teamId) => {
  // Convertir l'ID en nombre si possible (pour les IDs de format "team_41")
  let numericId;
  
  if (typeof teamId === 'string' && teamId.includes('_')) {
    // Extraire le nombre après le underscore (ex: "team_41" -> 41)
    const parts = teamId.split('_');
    numericId = parseInt(parts[parts.length - 1], 10);
  } else if (typeof teamId === 'string') {
    // Pour tout autre format de string, utiliser un hachage simple
    numericId = teamId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  } else {
    // Si c'est déjà un nombre, l'utiliser directement
    numericId = Number(teamId);
  }
  
  // S'assurer que numericId est bien un nombre
  if (isNaN(numericId)) {
    numericId = 0; // Valeur par défaut
  }
  
  // Utiliser le modulo pour obtenir un index dans les couleurs disponibles
  const colorIndex = (numericId % Object.keys(TEAM_BASE_COLORS).length) + 1;
  const colorKey = `team${colorIndex}`;
  
  return TEAM_BASE_COLORS[colorKey];
};

/**
 * Fonction pour générer un système de couleurs basé sur les équipes et leurs membres
 */
export const generateTaskColorSystem = (resources) => {
  // Map pour stocker les couleurs de chaque membre
  const memberColorMap = {};
  
  // Identifier toutes les équipes (celles dont l'ID commence par "team_")
  const teams = resources.filter(resource => 
    typeof resource.id === 'string' && resource.id.startsWith('team_')
  );
  
  // Map pour associer les IDs d'équipe à leurs couleurs de base
  const teamColorMap = {};
  
  // Attribuer une couleur de base à chaque équipe en utilisant notre fonction cohérente
  teams.forEach(team => {
    teamColorMap[team.id] = getTeamColor(team.id);
  });
  
  // Pour chaque équipe, trouver tous ses membres et leur attribuer des nuances de la couleur de l'équipe
  teams.forEach(team => {
    // Trouver tous les membres de cette équipe (ceux qui ont parentId égal à l'ID de l'équipe)
    const teamMembers = resources.filter(
      resource => resource.parentId === team.id
    );
    
    // La couleur de base de l'équipe
    const baseColor = teamColorMap[team.id];
    
    if (baseColor && teamMembers.length > 0) {
      // Créer des nuances différentes pour chaque membre
      teamMembers.forEach((member, memberIndex) => {
        // Calcul de variation pour obtenir des nuances différentes
        const variationPercent = -15 + (memberIndex * (30 / Math.max(teamMembers.length - 1, 1)));
        
        // Générer la couleur variée pour ce membre
        const memberColor = adjustColor(baseColor, variationPercent);
        memberColorMap[member.id] = memberColor;
      });
    }
  });
  
  // Pour tout membre qui n'aurait pas de couleur assignée (pas d'équipe ou autre)
  resources.forEach(resource => {
    // Ne pas attribuer de couleur aux équipes
    if (typeof resource.id === 'string' && resource.id.startsWith('team_')) {
      return;
    }
    
    // Si le membre n'a pas encore de couleur, lui attribuer une couleur par défaut
    if (!memberColorMap[resource.id]) {
      memberColorMap[resource.id] = '#9CA3AF';
    }
  });

  return memberColorMap;
};

/**
 * Fonction pour ajuster une couleur (éclaircir/assombrir)
 */
export const adjustColor = (hex, percent) => {
  // Convertir le hex en RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  // Ajuster la couleur (positif = éclaircir, négatif = assombrir)
  if (percent > 0) {
    // Éclaircir
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
  } else {
    // Assombrir
    const p = Math.abs(percent) / 100;
    r = Math.max(0, Math.floor(r * (1 - p)));
    g = Math.max(0, Math.floor(g * (1 - p)));
    b = Math.max(0, Math.floor(b * (1 - p)));
  }
  
  // Convertir RGB en hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Fonction pour déterminer si le texte doit être blanc ou noir sur une couleur de fond
 */
export const getContrastTextColor = (backgroundColor) => {
  // Convertir le hex en RGB
  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);
  
  // Calculer la luminosité (formule standard)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Si la luminosité est élevée (couleur claire), retourner du texte foncé
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};