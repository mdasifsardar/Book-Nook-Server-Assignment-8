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

// ------------------ 1st Collection
// ------------------ POST Book
app.post("/add-books", async (req, res) => {
  const { bookCollection, myBookCollection } = await connectToMongoDB();
  const data = req.body;

  const newBook = {
    ...data,
    copies: Number(data.copies),
  };

  const result = await bookCollection.insertOne(newBook);
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

// ------------------ 2nd Collection
// ------------------ GET Book by Email
app.get("/my-book/:userEmail", async (req, res) => {
  const { myBookCollection } = await connectToMongoDB();
  const { userEmail } = req.params;

  const result = await myBookCollection
    .find({ userEmail: userEmail })
    .toArray();

  res.send(result);
});

// ------------------ DELETE Book by bookId
app.delete("/my-book/:id", async (req, res) => {
  const { myBookCollection } = await connectToMongoDB();
  const { id } = req.params;
  const result = await myBookCollection.deleteOne({ _id: new ObjectId(id) });

  res.send(result);
});

// ------------------ 3rd Collection
// ------------------ Post Borrow Book
app.post("/my-borrow", async (req, res) => {
  const { borrowCollection, bookCollection } = await connectToMongoDB();
  const data = req.body;

  const borrowedBooks = await borrowCollection.findOne({
    bookId: data.bookId,
    userEmail: data.userEmail,
  });

  if (borrowedBooks) {
    return res.status(400).send({
      success: false,
      message: "You have already borrowed this book!",
    });
  }

  const result = await borrowCollection.insertOne(data);

  await bookCollection.updateOne(
    {
      _id: new ObjectId(data.bookId),
    },
    { $inc: { copies: -1 } },
  );

  res.send(result);
});

// ------------------ Get All Borrow Book
app.get("/borrows", async (req, res) => {
  const { borrowCollection } = await connectToMongoDB();

  const result = await borrowCollection.find().toArray();
  res.send(result);
});

// ------------------ Get One Borrow Book by userEmail
app.get("/borrow/:userEmail", async (req, res) => {
  const { borrowCollection } = await connectToMongoDB();
  const { userEmail } = req.params;

  const result = await borrowCollection
    .find({ userEmail: userEmail })
    .toArray();

  res.send(result);
});
