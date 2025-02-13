const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Vérifications avant l'insertion
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1 OR name = $2', [email, name]);
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists:', existingUser.rows);
      return res.status(400).json({ error: 'Email ou nom déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id, name, email',
      [name, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password }); // Log complet

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Query result:', result.rows); // Log du résultat de la requête

    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user.user_id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    res.json({ user: { id: user.user_id, email: user.email }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };