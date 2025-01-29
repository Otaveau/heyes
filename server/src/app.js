const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

const authRouter = require('./routes/auth');
const teamRouter = require('./routes/teams');
const ownerRouter = require('./routes/owners');
const taskRouter = require('./routes/tasks');
const statusRouter = require('./routes/status');

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/teams', teamRouter);
app.use('/api/owners', ownerRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/status', statusRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Une erreur est survenue!' });
 });
 
 app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
 });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
