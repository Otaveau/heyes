const { request } = require('../app');
const { Task } = require('../models/Task');

const getTasks = async (req, res) => {
  console.log('Getting tasks for user:', req.user.id);
  try {
    const tasks = await Task.findAll(req.user.id);
    console.log('Found tasks:', tasks);
    res.json(tasks);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTask = async (req, res) => {
  console.log('request :', req.body);
  const { title, start_date, end_date, owner_id, status } = req.body;
  const data = {
    title,
    startDate: start_date,
    endDate: end_date,
    ownerId: owner_id,
    statusId: status, // Assurez-vous que `status` est bien l'ID attendu
  };
  try {
    const task = await Task.create(data, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, start_date, end_date, owner_id, status } = req.body;
  const data = {
    title,
    startDate: start_date,
    endDate: end_date,
    ownerId: owner_id,
    statusId: status,
  };
  try {
    const task = await Task.update(id, data, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { statusId } = req.body;

  try {
      const task = await Task.updateStatus(id, statusId, req.user.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.delete(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTaskTasks = async (req, res) => {
  try {
    const tasks = await Task.getTasks(req.params.id, req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskTasks,
  updateTaskStatus
};