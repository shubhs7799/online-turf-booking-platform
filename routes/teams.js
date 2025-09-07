const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  createTeam,
  getMyTeam,
  getTeamsByLocation,
  joinTeam
} = require('../controllers/teamController');

const router = express.Router();

// Create a team (Player only)
router.post('/', authenticateToken, requireRole(['player']), createTeam);

// Get captain's team with members
router.get('/my-team', authenticateToken, requireRole(['player']), getMyTeam);

// Get teams by location
router.get('/:location', getTeamsByLocation);

// Join a team (Player only)
router.post('/:id/join', authenticateToken, requireRole(['player']), joinTeam);

module.exports = router;
