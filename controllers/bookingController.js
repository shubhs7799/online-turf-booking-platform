const { Booking, Slot, Turf, sequelize } = require('../models');

const createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { slot_id } = req.body;
    
    // Check if slot exists and is available
    const slot = await Slot.findByPk(slot_id, { 
      include: [{ model: Turf }],
      transaction 
    });
    
    if (!slot) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    if (slot.is_booked) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Slot already booked' });
    }
    
    // Check for overlapping time slots for the same user on same date
    const overlappingBookings = await Booking.findAll({
      where: { 
        user_id: req.user.id,
        status: { [require('sequelize').Op.ne]: 'cancelled' }
      },
      include: [{
        model: Slot,
        where: {
          date: slot.date,
          // Simple overlap check: slot times overlap if start_time < other_end_time AND end_time > other_start_time
          start_time: { [require('sequelize').Op.lt]: slot.end_time },
          end_time: { [require('sequelize').Op.gt]: slot.start_time }
        }
      }],
      transaction
    });
    
    if (overlappingBookings.length > 0) {
      await transaction.rollback();
      const conflictSlot = overlappingBookings[0].Slot;
      return res.status(400).json({ 
        error: `You already have a booking from ${conflictSlot.start_time} to ${conflictSlot.end_time} on ${conflictSlot.date}. Cannot book overlapping slots.`
      });
    }
    
    // Create booking and mark slot as booked
    const booking = await Booking.create({
      user_id: req.user.id,
      slot_id,
      status: 'confirmed'
    }, { transaction });
    
    await slot.update({ is_booked: true }, { transaction });
    
    await transaction.commit();
    
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: Slot,
          include: [{ model: Turf }]
        }
      ]
    });
    
    res.status(201).json(bookingWithDetails);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Slot,
          include: [{ model: Turf }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Slot }],
      transaction
    });
    
    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Booking already cancelled' });
    }
    
    // Check if cancellation is allowed (30 minutes before slot start time)
    const slotDateTime = new Date(`${booking.Slot.date}T${booking.Slot.start_time}`);
    const now = new Date();
    const timeDiff = slotDateTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff <= 30) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Cannot cancel booking. Cancellation allowed only 30 minutes before slot time.' 
      });
    }
    
    await booking.update({ status: 'cancelled' }, { transaction });
    await booking.Slot.update({ is_booked: false }, { transaction });
    
    await transaction.commit();
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking
};
