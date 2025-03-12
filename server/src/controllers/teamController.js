const { Team } = require('../models/Team');

const getTeams = async (req, res) => {
  try {
    const teams = await Team.findAll(req.user.id);
    res.json(teams);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id, req.user.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const team = await Team.create(req.body, req.user.id);
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    const team = await Team.update(req.params.id, req.body, req.user.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const team = await Team.delete(req.params.id, req.user.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTeamTasks = async (req, res) => {
  try {
    const tasks = await Team.getTasks(req.params.id, req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamTasks
};