const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/database');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.post('/validate', authMiddleware, (req, res) => {
  res.json({ 
    userId: req.user.id,
    message: 'Token valide'
  });
});

// Route de déconnexion (optionnelle côté serveur)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ 
    message: 'Déconnexion réussie'
  });
});

// Route pour vérifier si un nom d'utilisateur est disponible
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query('SELECT EXISTS(SELECT 1 FROM users WHERE name = $1)', [username]);
    res.json({ 
      exists: result.rows[0].exists,
      available: !result.rows[0].exists 
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du nom d\'utilisateur' });
  }
});

// Route pour rafraîchir les informations de l'utilisateur
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, name FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ 
      user: {
        id: result.rows[0].user_id,
        name: result.rows[0].name
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations utilisateur' });
  }
});

module.exports = router;
