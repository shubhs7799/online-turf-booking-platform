const { Team, TeamMember, User } = require('../models');

const createTeam = async (req, res) => {
  try {
    const { name, location } = req.body;
    
    const team = await Team.create({
      name,
      location,
      created_by: req.user.id
    });
    
    // Add creator as captain
    await TeamMember.create({
      team_id: team.id,
      user_id: req.user.id,
      role: 'captain'
    });
    
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeamsByLocation = async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: {
        location: { [require('sequelize').Op.iLike]: `%${req.params.location}%` }
      },
      include: [
        {
          model: TeamMember,
          include: [{ model: User, attributes: ['name', 'email', 'phone'] }]
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['name', 'email', 'phone']
        }
      ]
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const joinTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const existingMember = await TeamMember.findOne({
      where: { team_id: teamId, user_id: req.user.id }
    });
    
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this team' });
    }
    
    const teamMember = await TeamMember.create({
      team_id: teamId,
      user_id: req.user.id,
      role: 'player'
    });
    
    res.status(201).json({ message: 'Successfully joined team', teamMember });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({
      where: { created_by: req.user.id },
      include: [
        {
          model: TeamMember,
          include: [{ model: User, attributes: ['name', 'email', 'phone'] }]
        }
      ]
    });
    
    if (!team) {
      return res.status(404).json({ error: 'No team found' });
    }
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTeam,
  getMyTeam,
  getTeamsByLocation,
  joinTeam
};
