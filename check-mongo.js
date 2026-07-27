import mongoose from "mongoose";

async function checkMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection established");
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in database:");
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check if 'user' collection exists
    const userCollection = await mongoose.connection.db.collection('user').find().limit(5).toArray();
    console.log('\nUser collection sample (first 5 documents):');
    console.log(JSON.stringify(userCollection, null, 2));
  } catch (err) {
    console.error('Error connecting to MongoDB:', (err as Error).message);
  } finally {
    await mongoose.disconnect();
  }
}

checkMongoDB();