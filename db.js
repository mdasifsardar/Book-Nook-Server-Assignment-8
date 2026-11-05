import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");

    const db = client.db("booknook");
    const bookCollection = db.collection("books");
    const myBookCollection = db.collection("mybook");

    const borrowCollection = db.collection("borrow");

    return { bookCollection, myBookCollection, borrowCollection };
  } catch (err) {
    console.dir(err);
  }
}
connectToMongoDB();
