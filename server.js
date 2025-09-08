require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');


const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const turfRoutes = require('./routes/turfs');
const bookingRoutes = require('./routes/bookings');
const teamRoutes = require('./routes/teams');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/teams', teamRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Retry logic for database connection
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('Database connected successfully');
      return true;
    } catch (err) {
      console.log(`DB connection failed. Retry ${i + 1}/${retries} in ${delay/1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('Could not connect to database after retries.');
  return false;
};

// Start server after DB is ready
const startServer = async () => {
  const dbConnected = await connectWithRetry();
  if (!dbConnected) process.exit(1); // exit if DB fails

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
