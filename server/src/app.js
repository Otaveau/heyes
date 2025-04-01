const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(helmet());
app.use(express.json());

const authRouter = require('./routes/auth');
const teamRouter = require('./routes/teams');
const ownerRouter = require('./routes/owners');
const taskRouter = require('./routes/tasks');
const statusRouter = require('./routes/status');

app.use('/auth', authRouter);
app.use('/teams', teamRouter);
app.use('/owners', ownerRouter);
app.use('/tasks', taskRouter);
app.use('/status', statusRouter);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

module.exports = app;
