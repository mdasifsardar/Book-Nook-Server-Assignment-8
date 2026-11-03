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
  const { bookCollection, myBookCollection } = await connectToMongoDB();
  const data = req.body;

  const result = await bookCollection.insertOne(data);

  await myBookCollection.insertOne({
    ...data,
    bookId: result.insertedId,
  });

  res.send({
    insertedId: result.insertedId,
  });
});

// ------------------ GET All Book
app.get("/books", async (req, res) => {
  const { bookCollection } = await connectToMongoDB();

  const result = await bookCollection.find().toArray();
  res.send(result);
});

// ------------------ GET Books Details
app.get("/book/:id", async (req, res) => {
  const { bookCollection } = await connectToMongoDB();

  const { id } = req.params;
  const result = await bookCollection.findOne({ _id: new ObjectId(id) });

  res.send(result);
});

// ------------------ GET Book by Email
app.get("/my-book/:userEmail", async (req, res) => {
  const { myBookCollection } = await connectToMongoDB();
  const { userEmail } = req.params;

  const result = await myBookCollection
    .find({ userEmail: userEmail })
    .toArray();

  res.send(result);
});

// ------------------ DELETE Book by _id
app.delete("/my-book/:id", async (req, res) => {
  const { myBookCollection } = await connectToMongoDB();
  const { id } = req.params;
  const result = await myBookCollection.deleteOne({ bookId: new ObjectId(id) });

  res.send(result);
});
