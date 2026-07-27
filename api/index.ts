import app from '../src/app';
import mongoose from 'mongoose';

let isConnected = false;

async function connectDB() {
      if (isConnected) return;

      const uri = process.env.MONGODB_URI as string;
      await mongoose.connect(uri);
      isConnected = true;
}



export default async function handler(req: any, res: any) {
      await connectDB();
      return app(req, res);
}