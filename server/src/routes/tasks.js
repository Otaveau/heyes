const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, taskController.getTasks);
router.post('/', auth, taskController.createTask);
router.put('/:id', auth, taskController.updateTask);
router.patch('/:id/status', auth, taskController.updateTaskStatus);
router.delete('/:id', auth, taskController.deleteTask);

module.exports = router;

