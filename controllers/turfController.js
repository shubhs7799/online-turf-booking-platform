const { Turf, Slot, Booking, User } = require('../models');

const getMyTurf = async (req, res) => {
  try {
    const turf = await Turf.findOne({
      where: { owner_id: req.user.id }
    });
    res.json(turf || {});
  } catch (error) {
    console.error('Error fetching turf:', error);
    res.status(500).json({ error: error.message });
  }
};

const addSlots = async (req, res) => {
  try {
    const { date, start_time, end_time } = req.body;
    const turfId = req.params.id;
    
    const turf = await Turf.findOne({
      where: { id: turfId, owner_id: req.user.id }
    });
    
    if (!turf) {
      return res.status(404).json({ error: 'Turf not found or not owned by you' });
    }

    // Check if date is tomorrow or later
    const slotDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (slotDate < tomorrow) {
      return res.status(400).json({ 
        error: 'Slots can only be created for tomorrow or future dates' 
      });
    }

    const slot = await Slot.create({
      turf_id: turfId,
      date,
      start_time,
      end_time
    });
    
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTurfBookings = async (req, res) => {
  try {
    const turfId = req.params.id;
    
    const turf = await Turf.findOne({
      where: { id: turfId, owner_id: req.user.id }
    });
    
    if (!turf) {
      return res.status(404).json({ error: 'Turf not found or not owned by you' });
    }

    const bookings = await Booking.findAll({
      include: [
        {
          model: Slot,
          where: { turf_id: turfId },
          include: [{ model: Turf }]
        },
        { model: User, attributes: ['name', 'email', 'phone'] }
      ]
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchTurfs = async (req, res) => {
  try {
    const { location, sport, date } = req.query;
    const where = {};
    
    if (location) where.location = { [require('sequelize').Op.iLike]: `%${location}%` };
    if (sport) where.sport_type = { [require('sequelize').Op.iLike]: `%${sport}%` };
    
    // Build slot conditions to exclude past slots
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    let slotWhere = { is_booked: false };
    
    if (date) {
      if (date === today) {
        slotWhere.date = date;
        slotWhere.start_time = { [require('sequelize').Op.gt]: currentTime };
      } else {
        slotWhere.date = date;
      }
    } else {
      slotWhere[require('sequelize').Op.or] = [
        { date: { [require('sequelize').Op.gt]: today } },
        {
          date: today,
          start_time: { [require('sequelize').Op.gt]: currentTime }
        }
      ];
    }
    
    const turfs = await Turf.findAll({
      where,
      include: [
        {
          model: Slot,
          where: slotWhere,
          required: false
        },
        {
          model: User,
          as: 'Owner',
          attributes: ['name', 'phone', 'email']
        }
      ]
    });
    
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTurfSlots = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const slots = await Slot.findAll({
      where: {
        turf_id: req.params.id,
        is_booked: false,
        [require('sequelize').Op.or]: [
          { date: { [require('sequelize').Op.gt]: today } },
          {
            date: today,
            start_time: { [require('sequelize').Op.gt]: currentTime }
          }
        ]
      },
      include: [{ model: Turf }],
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyTurfSlots = async (req, res) => {
  try {
    const turf = await Turf.findOne({
      where: { owner_id: req.user.id }
    });
    
    if (!turf) {
      return res.status(404).json({ error: 'No turf found' });
    }

    const slots = await Slot.findAll({
      where: { turf_id: turf.id },
      include: [{ model: Turf }],
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });
    
    // Add status for each slot based on current time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const slotsWithStatus = slots.map(slot => {
      let status = 'available';
      
      if (slot.is_booked) {
        status = 'booked';
      } else if (slot.date < today || (slot.date === today && slot.start_time <= currentTime)) {
        status = 'expired';
      }
      
      return {
        ...slot.toJSON(),
        status
      };
    });
    
    res.json(slotsWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyTurf,
  getMyTurfSlots,
  addSlots,
  getTurfBookings,
  searchTurfs,
  getTurfSlots
};
