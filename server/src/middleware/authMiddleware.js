
const { verifyToken } = require('../config/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token d\'authentification manquant' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Format de token invalide' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = verifyToken(token);
      req.user = { id: decoded.id };
      next();
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expiré' });
      }
      return res.status(401).json({ error: 'Token invalide' });
    }
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'authentification' });
  }
};

module.exports = authMiddleware;
