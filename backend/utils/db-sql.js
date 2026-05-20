const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
);

const UserSQL = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  first_name: DataTypes.STRING,
  last_name: DataTypes.STRING,
  password: DataTypes.STRING,
  role: { type: DataTypes.STRING, defaultValue: 'user' },
  isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

const Reminder = sequelize.define('Reminder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.STRING, allowNull: false },
  fire_date: { type: DataTypes.DATE, allowNull: false },
  is_sent: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const PushSubscription = sequelize.define('PushSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  endpoint: { type: DataTypes.STRING, allowNull: false },
  keys: { type: DataTypes.JSON, allowNull: false }
});

// Связи
UserSQL.hasMany(Reminder, { foreignKey: 'user_id' });
Reminder.belongsTo(UserSQL, { foreignKey: 'user_id' });
UserSQL.hasMany(PushSubscription, { foreignKey: 'user_id' });
PushSubscription.belongsTo(UserSQL, { foreignKey: 'user_id' });

module.exports = { sequelize, UserSQL, Reminder, PushSubscription };