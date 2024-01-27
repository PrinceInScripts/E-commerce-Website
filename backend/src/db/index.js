import mongoose from "mongoose";
import {DB_NAME} from "../constant.js"

mongoose.set('strictQuery', false);

const connectDB = async () => {
   try {
     const {connection}=await mongoose.connect(process.env.MONGODB_URL,{
        dbName:DB_NAME,
     })
     if(connection){
        console.log(`Connection to MongoDB : ${connection.host}`);
     }
   } catch (error) {
    console.error("Error connecting to the database:", error.message);
    process.exit(1)
   }
}

export default connectDB;