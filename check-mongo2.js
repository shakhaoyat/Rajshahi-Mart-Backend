import mongoose from "mongoose";

async function testMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connected");
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    // Check user collection
    const userCount = await mongoose.connection.db.collection('user').countDocuments();
    console.log(`User count: ${userCount}`);
    
    // Close connection
    await mongoose.disconnect();
  } catch (err) {
    console.error('Connection error:', (err as Error).message);
  }
}

checkMongoDB();