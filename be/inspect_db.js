const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log("--- Categories ---");
  const categories = await db.collection('categories').find({}).toArray();
  for (const cat of categories) {
    console.log(`ID: ${cat._id} (type: ${typeof cat._id}, constructor: ${cat._id?.constructor?.name}), Name: ${cat.name}`);
  }

  console.log("\n--- Costumes ---");
  const costumes = await db.collection('costumes').find({}).toArray();
  if (costumes.length > 0) {
    const first = costumes[0];
    console.log(`Total costumes: ${costumes.length}`);
    console.log(JSON.stringify(first, null, 2));
  } else {
    console.log("No costumes found.");
  }
  
  mongoose.disconnect();
}

inspect().catch(console.error);
