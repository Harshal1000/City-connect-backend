import mongoose from "mongoose";

const connection = async () => {
  try {
    const connect = await mongoose.connect(`${process.env.MONGODB_URL}/eseva`)
    console.log(`✅ MongoDB connected: ${connect.connection.host}`);
  } catch (error) {
    console.log("mongodb connection error", error)
    process.exit(1);
  }
}

export { connection }