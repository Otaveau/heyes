const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const pool = require('../config/database');

const register = async (req, res) => {
  const { name, password } = req.body;

  // Validation des entrées
  if (!name || !password) {
    return res.status(400).json({ error: 'Le nom d\'utilisateur et le mot de passe sont requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    // Vérification si le nom d'utilisateur existe déjà
    const existingUser = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (name, password) VALUES ($1, $2) RETURNING user_id, name',
      [name, hashedPassword]
    );

    const newUser = result.rows[0];
    
    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: newUser.user_id,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

const login = async (req, res) => {
  const { name, password } = req.body;

  // Validation des entrées
  if (!name || !password) {
    return res.status(400).json({ error: 'Le nom d\'utilisateur et le mot de passe sont requis' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE name = $1', [name]);

    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    const token = generateToken(user.user_id);
    
    res.json({ 
      message: 'Connexion réussie',
      user: { 
        id: user.user_id, 
        name: user.name 
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

module.exports = { register, login };
