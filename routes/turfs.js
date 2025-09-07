const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getMyTurf,
  getMyTurfSlots,
  addSlots,
  getTurfBookings,
  searchTurfs,
  getTurfSlots
} = require('../controllers/turfController');

const router = express.Router();

// Get turf owner's turf (single turf)
router.get('/my-turfs', authenticateToken, requireRole(['turf_owner']), getMyTurf);

// Get turf owner's slots
router.get('/my-slots', authenticateToken, requireRole(['turf_owner']), getMyTurfSlots);

// Add slots to a turf
router.post('/:id/slots', authenticateToken, requireRole(['turf_owner']), addSlots);

// Get bookings for turf owner's turf
router.get('/:id/bookings', authenticateToken, requireRole(['turf_owner']), getTurfBookings);

// Search turfs
router.get('/search', searchTurfs);

// Get available slots for a turf
router.get('/:id/slots', getTurfSlots);

module.exports = router;
