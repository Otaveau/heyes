const { Owner } = require('../models/Owner');

const getOwners = async (req, res) => {
  try {
    const owners = await Owner.findAll(req.user.id);
    res.json(owners);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getOwnerById = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id, req.user.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createOwner = async (req, res) => {
  try {
    const owner = await Owner.create(req.body, req.user.id);
    res.status(201).json(owner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateOwner = async (req, res) => {
  try {
    const owner = await Owner.update(req.params.id, req.body, req.user.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteOwner = async (req, res) => {
  try {
    const owner = await Owner.delete(req.params.id, req.user.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getOwnerTasks = async (req, res) => {
  try {
    const tasks = await Owner.getTasks(req.params.id, req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOwners,
  getOwnerById,
  createOwner,
  updateOwner,
  deleteOwner,
  getOwnerTasks
};