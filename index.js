import express from "express";
import cors from "cors";
import { connectToMongoDB } from "./db.js";
import { ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.send({ message: "Server Create Successfully!" }),
);

app.listen(port, () => console.log(`Server running port on ${port}!`));

//          Database

// ------------------ POST Book
app.post("/add-books", async (req, res) => {
  const bookCollection = await connectToMongoDB();
  const data = req.body;

  const result = await bookCollection.insertOne(data);
  res.send(result);
});

// ------------------ GET All Book
app.get("/books", async (req, res) => {
  const bookCollection = await connectToMongoDB();

  const result = await bookCollection.find().toArray();
  res.send(result);
});

// ------------------ GET Book by Email
app.get("/my-books/:userEmail", async (req, res) => {
  const bookCollection = await connectToMongoDB();
  const { userEmail } = req.params;

  const result = await bookCollection.find({ userEmail: userEmail }).toArray();

  res.send(result);
});

// ------------------ DELETE Book by _id
app.delete("/my-books/:id", async (req, res) => {
  const bookCollection = await connectToMongoDB();
  const { id } = req.params;
  const result = await bookCollection.deleteOne({ _id: new ObjectId(id) });

  res.send(result);
});
