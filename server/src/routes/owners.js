const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, ownerController.getOwners);
router.post('/', auth, ownerController.createOwner);
router.put('/:id', auth, ownerController.updateOwner);
router.delete('/:id', auth, ownerController.deleteOwner);

module.exports = router;
