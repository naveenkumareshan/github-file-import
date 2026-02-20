
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getRestrictions,
  createRestriction,
  updateRestriction,
  deleteRestriction,
  toggleRestrictionStatus
} = require('../controllers/roomRestrictionController');

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Room restriction routes
router.get('/', getRestrictions);
router.post('/', createRestriction);
router.put('/:restrictionId', updateRestriction);
router.delete('/:restrictionId', deleteRestriction);
router.patch('/:restrictionId/toggle', toggleRestrictionStatus);

module.exports = router;
