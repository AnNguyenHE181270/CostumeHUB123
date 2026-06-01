const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const collection = db.collection("costumes");
  const docs = await collection.find({}).toArray();
  
  if (docs.length > 0) {
    const first = docs[0];
    console.log("categoryId type:", typeof first.categoryId, "constructor:", first.categoryId?.constructor?.name);
    console.log("category type:", typeof first.category, "constructor:", first.category?.constructor?.name);
    
    // Quick migration just in case
    for (const doc of docs) {
      if (doc.categoryId && typeof doc.categoryId === 'string') {
        await collection.updateOne({ _id: doc._id }, { $set: { categoryId: new mongoose.Types.ObjectId(doc.categoryId) } });
        console.log("Updated categoryId for", doc.name);
      }
    }
  }
  
  mongoose.disconnect();
}

check().catch(console.error);
