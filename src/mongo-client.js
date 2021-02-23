import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";

export default new MongoClient(uri,
  { useUnifiedTopology: true } 
);
