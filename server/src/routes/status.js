const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, statusController.getStatuss);
router.post('/', auth, statusController.createStatus);
router.put('/:id', auth, statusController.updateStatus);
router.delete('/:id', auth, statusController.deleteStatus);

module.exports = router;