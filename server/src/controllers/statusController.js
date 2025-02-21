const { Status } = require('../models/Status');

const getStatuss = async (req, res) => {
  try {
    const statuss = await Status.findAll(req.user.id);
    res.json(statuss);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStatusById = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id, req.user.id);
    if (!status) return res.status(404).json({ error: 'Status not found' });
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createStatus = async (req, res) => {
  try {
    const status = await Status.create(req.body, req.user.id);
    res.status(201).json(status);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const status = await Status.update(req.params.id, req.body, req.user.id);
    if (!status) return res.status(404).json({ error: 'Status not found' });
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteStatus = async (req, res) => {
  try {
    const status = await Status.delete(req.params.id, req.user.id);
    if (!status) return res.status(404).json({ error: 'Status not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getStatusTasks = async (req, res) => {
  try {
    const tasks = await Status.getTasks(req.params.id, req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStatuss,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
  getStatusTasks
};