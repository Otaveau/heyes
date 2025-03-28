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
/**
 * Fonction pour générer un système de couleurs basé sur les équipes et leurs membres
 * avec des nuances fortement accentuées, surtout entre les positions 2 et 3
 */
export const generateTaskColorSystem = (resources) => {
  // Map pour stocker les couleurs de chaque membre
  const memberColorMap = {};
  
  // Identifier toutes les équipes
  const teams = resources.filter(resource => 
    typeof resource.id === 'string' && resource.id.startsWith('team_')
  );
  
  // Map pour associer les IDs d'équipe à leurs couleurs de base
  const teamColorMap = {};
  
  // Attribuer une couleur de base à chaque équipe
  teams.forEach(team => {
    teamColorMap[team.id] = getTeamColor(team.id);
  });
  
  // Pour chaque équipe, trouver tous ses membres et leur attribuer des nuances distinctes
  teams.forEach(team => {
    const teamMembers = resources.filter(
      resource => resource.parentId === team.id
    );
    
    const baseColor = teamColorMap[team.id];
    
    if (baseColor && teamMembers.length > 0) {
      // Définir des paliers de variation prédéfinis pour créer des écarts plus marqués
      // Utiliser une distribution non-linéaire pour accentuer les différences
      const variationTable = [
        -35,  // Premier membre: beaucoup plus sombre
        -15,  // Deuxième membre: légèrement plus sombre
        20,   // Troisième membre: nettement plus clair (grand écart avec le 2ème)
        40    // Quatrième membre: très clair
      ];
      
      // Pour les équipes avec plus de membres, générer plus de variations
      if (teamMembers.length > variationTable.length) {
        // Compléter avec des valeurs intermédiaires ou extrêmes pour les membres supplémentaires
        for (let i = variationTable.length; i < teamMembers.length; i++) {
          // Alterner entre des valeurs très sombres et très claires pour maximiser le contraste
          variationTable.push(i % 2 === 0 ? -40 - (i * 2) : 45 + (i * 2));
        }
      }
      
      // Assigner les couleurs aux membres
      teamMembers.forEach((member, memberIndex) => {
        // Utiliser la valeur de variation du tableau ou une valeur par défaut
        const variationPercent = memberIndex < variationTable.length 
          ? variationTable[memberIndex]
          : (memberIndex % 2 === 0 ? -30 : 30); // Valeur par défaut alternée
        
        const memberColor = adjustColor(baseColor, variationPercent);
        memberColorMap[member.id] = memberColor;
      });
    }
  });
  
  // Traiter les membres sans équipe assignée
  resources.forEach(resource => {
    if (typeof resource.id === 'string' && resource.id.startsWith('team_')) {
      return;
    }
    
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