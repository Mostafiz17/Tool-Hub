import { MongoClient, type Collection, type Db } from "mongodb";
import type { UserDocument } from "@/db/schema";

const mongoUri = process.env.MONGODB_URI ?? "";
const databaseName = process.env.MONGODB_DB || "app_db";

if (!mongoUri) {
  throw new Error("MONGODB_URI is required");
}

const globalForMongo = globalThis as typeof globalThis & {
  __toolHubMongoClient?: Promise<MongoClient>;
  __toolHubMongoIndexes?: Promise<void>;
};

function connect(): Promise<MongoClient> {
  if (!globalForMongo.__toolHubMongoClient) {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5_000 });
    globalForMongo.__toolHubMongoClient = client.connect().catch((error) => {
      globalForMongo.__toolHubMongoClient = undefined;
      throw error;
    });
  }
  return globalForMongo.__toolHubMongoClient;
}

export async function getDatabase(): Promise<Db> {
  return (await connect()).db(databaseName);
}

async function ensureIndexes(collection: Collection<UserDocument>): Promise<void> {
  if (!globalForMongo.__toolHubMongoIndexes) {
    globalForMongo.__toolHubMongoIndexes = collection
      .createIndex({ email: 1 }, { unique: true, name: "users_email_unique" })
      .then(() => undefined)
      .catch((error) => {
        globalForMongo.__toolHubMongoIndexes = undefined;
        throw error;
      });
  }
  return globalForMongo.__toolHubMongoIndexes;
}

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const collection = (await getDatabase()).collection<UserDocument>("users");
  await ensureIndexes(collection);
  return collection;
}

export async function pingDatabase(): Promise<void> {
  await (await getDatabase()).command({ ping: 1 });
}
