import { Db, MongoClient } from "mongodb";

export const connectDB = async (): Promise<Db> => {
  const usr = "JulioRD";
  const pwd = "Julio";
  const dbName: string = "Usuarios";
  const mongouri: string = `mongodb+srv://${usr}:${pwd}@cluster0.xqzvr.mongodb.net/${dbName}?retryWrites=true&w=majority`;
  const client = new MongoClient(mongouri);

  try {
    await client.connect();
    console.info("MongoDB connected");

    return client.db(dbName);
  } catch (e) {
    throw e;
  }
};