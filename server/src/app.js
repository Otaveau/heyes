const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/api');
const app = express();

// Configuration CORS optimisée pour Vercel
const corsOptions = {
  origin: process.env.CLIENT_URL || 'https://heyes-client.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
};

// Appliquer CORS globalement
app.use(cors(corsOptions));

// Gérer explicitement les requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Configurer Helmet avec contentSecurityPolicy désactivé pour éviter les conflits
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(express.json());

// Route racine (pour vérifier que l'API fonctionne)
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: "Heyes API is running", 
    status: "healthy",
    corsOrigin: corsOptions.origin // Pour déboguer
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