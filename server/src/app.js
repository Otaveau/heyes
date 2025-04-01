const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/api');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*', // URL de votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(helmet());
app.use(express.json());

// Route racine (pour vérifier que l'API fonctionne)
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: "Heyes API is running", 
    status: "healthy" 
  });
});

// Routes API
app.use('/api', apiRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

module.exports = app;