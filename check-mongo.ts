import mongoose from "mongoose";

async function checkMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connected");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const userCollection = await mongoose.connection.db.collection('user').find().toArray();
    console.log('User collection count:', userCollection.length);
    
    if (userCollection.length > 0) {
      console.log('First user document:');
      console.log(JSON.stringify(userCollection[0], null, 2));
    }
  } catch (err) {
    console.error('MongoDB connection error:', (err as Error).message);
  } finally {
    await mongoose.disconnect();
  }
}

checkMongoDB();