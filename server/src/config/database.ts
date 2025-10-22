import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = () => {
  const mongoUri = process.env.MONGO_URI as string;

  mongoose.connect(mongoUri)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(err => {
      console.error('Could not connect to MongoDB:', err);
      process.exit(1);
    });
};