const { MongoClient, ObjectId } = require('mongodb');

let db = null;

async function getDb() {
  if (db) return db;
  const client = new MongoClient(process.env.MONGO_URI || 'mongodb://mongo:27017');
  await client.connect();
  db = client.db();  // база по умолчанию из строки подключения (usersdb)
  console.log('✅ MongoDB connected (native driver)');
  return db;
}

module.exports = {
  async create(data) {
    const database = await getDb();
    const doc = {
      first_name: data.first_name,
      last_name: data.last_name,
      age: data.age,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await database.collection('users').insertOne(doc);
    return { _id: result.insertedId, ...doc };
  },
  async findAll() {
    const database = await getDb();
    return await database.collection('users').find().toArray();
  },
  async findById(id) {
    const database = await getDb();
    return await database.collection('users').findOne({ _id: new ObjectId(id) });
  },
  async updateById(id, updates) {
    const database = await getDb();
    updates.updatedAt = new Date();
    const result = await database.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result;
  },
  async deleteById(id) {
    const database = await getDb();
    const result = await database.collection('users').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};