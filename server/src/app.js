const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(helmet());
app.use(express.json());

// Ajoutez une route racine
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: "Heyes API is running", 
    status: "healthy" 
  });
});

const apiRoutes = require('./routes/api');

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
