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
      console.log("Db connected");
    } catch (error) {
      console.log("Error in connection db");
      process.exit(1);
    }
  }
}

export default Database;
