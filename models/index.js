const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.NODE_ENV === 'production'
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
      }
    );


// Models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Turf = require('./Turf')(sequelize, Sequelize.DataTypes);
const Slot = require('./Slot')(sequelize, Sequelize.DataTypes);
const Booking = require('./Booking')(sequelize, Sequelize.DataTypes);
const Team = require('./Team')(sequelize, Sequelize.DataTypes);
const TeamMember = require('./TeamMember')(sequelize, Sequelize.DataTypes);

// Associations
Turf.belongsTo(User, { foreignKey: 'owner_id', as: 'Owner' });
User.hasMany(Turf, { foreignKey: 'owner_id', as: 'turfs' });

Slot.belongsTo(Turf, { foreignKey: 'turf_id' });
Turf.hasMany(Slot, { foreignKey: 'turf_id' });

Booking.belongsTo(User, { foreignKey: 'user_id' });
Booking.belongsTo(Slot, { foreignKey: 'slot_id' });
User.hasMany(Booking, { foreignKey: 'user_id' });
Slot.hasOne(Booking, { foreignKey: 'slot_id' });

Team.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });
User.hasMany(Team, { foreignKey: 'created_by', as: 'createdTeams' });

TeamMember.belongsTo(Team, { foreignKey: 'team_id' });
TeamMember.belongsTo(User, { foreignKey: 'user_id' });
Team.hasMany(TeamMember, { foreignKey: 'team_id' });
User.hasMany(TeamMember, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Turf,
  Slot,
  Booking,
  Team,
  TeamMember,
};
