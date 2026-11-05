import express from "express";
import cors from "cors";
import { connectToMongoDB } from "./db.js";
import { ObjectId } from "mongodb";
import { jwtVerify, createRemoteJWKSet } from "jose";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.send({ message: "Server Create Successfully!" }),
);

//          Database

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log(authHeader);

  if (!authHeader) {
    return res.status(401).send({
      message: "Unauthorized!",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({
      message: "Unauthorized!",
    });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ message: "Internal server error" });
  }
};

// ------------------ 1st Collection
// ------------------ POST Book
app.post("/add-books", verifyToken, async (req, res) => {
  try {
    const { bookCollection, myBookCollection } = await connectToMongoDB();
    const data = req.body;

    const existingAddBook = await myBookCollection.findOne({
      userEmail: data.userEmail,
      name: data.name,
      author: data.author,
    });

    if (existingAddBook) {
      return res.status(409).send({
        success: false,
        message: "You have already added this book!",
      });
    }

    const newBook = {
      ...data,
      copies: Number(data.copies),
    };

    const result = await bookCollection.insertOne(newBook);
    await myBookCollection.insertOne({
      ...data,
      bookId: result.insertedId,
      copies: Number(data.copies),
    });

    res.status(201).send({
      success: true,
      message: "Book added successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "Internal server error!",
    });
  }
});

// ------------------ GET All Book
app.get("/books", async (req, res) => {
  const { bookCollection } = await connectToMongoDB();

  const result = await bookCollection.find().toArray();
  res.send(result);
});

// ------------------ GET Books Details
app.get("/book/:id", verifyToken, async (req, res) => {
  const { bookCollection } = await connectToMongoDB();

  const { id } = req.params;
  const result = await bookCollection.findOne({ _id: new ObjectId(id) });

  res.send(result);
});

// ------------------ 2nd Collection
// ------------------ GET Book by Email
app.get("/my-book/:userEmail", verifyToken, async (req, res) => {
  const { myBookCollection } = await connectToMongoDB();
  const { userEmail } = req.params;

  const result = await myBookCollection
    .find({ userEmail: userEmail })
    .toArray();

  res.send(result);
});

// ------------------ DELETE Book by bookId
app.delete("/my-book/:id", verifyToken, async (req, res) => {
  const { myBookCollection, bookCollection } = await connectToMongoDB();
  const { id } = req.params;
  const result = await myBookCollection.deleteOne({ _id: new ObjectId(id) });

  //        Delete one book from bookCollection too
  const myBook = await myBookCollection.findOne({ _id: new ObjectId(id) });

  if (myBook?.bookId) {
    await bookCollection.deleteOne({ _id: new ObjectId(myBook.bookId) });
  }

  res.send(result);
});

// ------------------ PATCH Book by bookId
app.patch("/my-book/:id", verifyToken, async (req, res) => {
  const { myBookCollection, bookCollection } = await connectToMongoDB();
  const { id } = req.params;

  const data = req.body;
  const result = await myBookCollection.updateOne(
    { _id: new ObjectId(id) },

    {
      $set: {
        ...data,
        copies: Number(data.copies),
      },
    },
  );

  await bookCollection.updateOne(
    {
      _id: new ObjectId(data.bookId),
    },
    { $set: { ...data, copies: Number(data.copies) } },
  );

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

// ------------------ Delete One Borrow Book by ID
app.patch("/borrow/:id", verifyToken, async (req, res) => {
  const { borrowCollection, bookCollection } = await connectToMongoDB();
  const { id } = req.params;

  const borrowBook = await borrowCollection.findOne({ _id: new ObjectId(id) });

  if (borrowBook) {
    await bookCollection.updateOne(
      {
        _id: new ObjectId(borrowBook.bookId),
      },
      { $inc: { copies: 1 } },
    );
  }

  const result = await borrowCollection.deleteOne({ _id: new ObjectId(id) });

  res.send(result);
});

//
app.listen(port, () => console.log(`Server running port on ${port}!`));
export default app;
