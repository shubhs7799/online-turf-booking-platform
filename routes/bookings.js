const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  cancelBooking
} = require('../controllers/bookingController');

const router = express.Router();

// Book a slot (Player only)
router.post('/', authenticateToken, requireRole(['player']), createBooking);

// Get user's bookings
router.get('/my-bookings', authenticateToken, requireRole(['player']), getMyBookings);

// Cancel booking
router.put('/:id/cancel', authenticateToken, requireRole(['player']), cancelBooking);

module.exports = router;
