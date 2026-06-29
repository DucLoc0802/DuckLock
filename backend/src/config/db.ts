import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ducklock';
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection disconnected.');
    });

    await mongoose.connect(connString);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};
