const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const ownersRoutes = require('./owners');
const statusRoutes = require('./status');
const tasksRoutes = require('./tasks');
const teamsRoutes = require('./teams');

router.use('/auth', authRoutes);
router.use('/owners', ownersRoutes);
router.use('/status', statusRoutes);
router.use('/tasks', tasksRoutes);
router.use('/teams', teamsRoutes);

module.exports = router;