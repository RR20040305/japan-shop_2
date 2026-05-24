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

const SimpleUser = sequelize.define('SimpleUser', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false }
}, { timestamps: true });

const Product = sequelize.define('Product', {
  title: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false }
});

const Author = sequelize.define('Author', {
  name: { type: DataTypes.STRING, allowNull: false }
});

const Book = sequelize.define('Book', {
  title: { type: DataTypes.STRING, allowNull: false },
  authorId: { type: DataTypes.INTEGER, allowNull: false }
});

// Связи
UserSQL.hasMany(Reminder, { foreignKey: 'user_id' });
Reminder.belongsTo(UserSQL, { foreignKey: 'user_id' });
UserSQL.hasMany(PushSubscription, { foreignKey: 'user_id' });
PushSubscription.belongsTo(UserSQL, { foreignKey: 'user_id' });
Author.hasMany(Book, { foreignKey: 'authorId' });
Book.belongsTo(Author, { foreignKey: 'authorId' });

module.exports = {
  sequelize,
  UserSQL,
  Reminder,
  PushSubscription,
  SimpleUser,
  Product,
  Author,
  Book
};