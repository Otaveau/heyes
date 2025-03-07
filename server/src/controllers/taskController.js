const { Task } = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll(req.user.id);
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
  const { title, startDate, endDate, description, ownerId, statusId } = req.body;
  const data = {
    title,
    start_date: startDate || null,
    end_date: endDate || null,
    description: description || null,
    owner_id: ownerId || null,
    status_id: statusId
  };

  
  try {
    const task = await Task.create(data, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, startDate, endDate, description, ownerId, statusId } = req.body;

  const data = {
    title,
    start_date: startDate,
    end_date: endDate,
    description: description,
    owner_id: ownerId,
    status_id: statusId
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


module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus
};