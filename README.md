# Turf Booking Platform

A full-stack web application for booking sports turfs with team management features.

## Features

### For Players:
- Search turfs by location, sport, and date
- Book available slots
- View and cancel bookings
- Create and join teams

### For Turf Owners:
- Register and manage turfs
- Add available time slots
- View bookings for their turfs

## Tech Stack

**Frontend:**
- HTML, CSS, JavaScript
- Bootstrap 5 for UI
- Axios for API requests

**Backend:**
- Express.js REST API
- PostgreSQL with Sequelize ORM
- JWT authentication
- bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup PostgreSQL database:**
   - Create a database named `turf_booking`
   - Update database credentials in `.env` file

3. **Configure environment variables:**
   ```bash
   # Update .env file with your database credentials
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=turf_booking
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the server:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

6. **Access the application:**
   Open http://localhost:3000 in your browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Turfs
- `POST /api/turfs` - Register new turf (Turf Owner only)
- `GET /api/turfs/my-turfs` - Get owner's turfs
- `POST /api/turfs/:id/slots` - Add slots to turf
- `GET /api/turfs/:id/bookings` - View turf bookings
- `GET /api/turfs/search` - Search turfs
- `GET /api/turfs/:id/slots` - Get available slots

### Bookings
- `POST /api/bookings` - Book a slot (Player only)
- `GET /api/bookings/my-bookings` - Get user's bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Teams
- `POST /api/teams` - Create team (Player only)
- `GET /api/teams/:location` - Get teams by location
- `POST /api/teams/:id/join` - Join team

## Database Schema

### Models:
- **User**: id, name, email, password, role
- **Turf**: id, name, location, sport_type, owner_id
- **Slot**: id, turf_id, date, start_time, end_time, is_booked
- **Booking**: id, user_id, slot_id, status
- **Team**: id, name, location, created_by
- **TeamMember**: id, team_id, user_id, role

## Features Implemented

✅ Role-based authentication (Player/Turf Owner)
✅ JWT token-based security
✅ Password encryption with bcrypt
✅ Database transactions for booking slots
✅ Responsive Bootstrap UI
✅ Search functionality for turfs
✅ Real-time slot availability
✅ Team creation and management
✅ Booking management with cancellation
✅ Owner dashboard for turf management
