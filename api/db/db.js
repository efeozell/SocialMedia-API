import mongoose from "mongoose";

let instance = null;

class Database {
  constructor() {
    if (!instance) {
      this.mongoConnection = null;
      instance = this;
    }

    return instance;
  }

  async connectDB(connectionString) {
    try {
      console.log("Db connection...");
      let db = await mongoose.connect(connectionString);
      console.log(`MongoDB connected: ${db.connection.host}`);
    } catch (error) {
      console.log("Error in connection db: ", error);
      process.exit(1);
    }
  }
}

export default Database;
