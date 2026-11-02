import express from "express";
import cors from "cors";
import { connectToMongoDB } from "./db.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.send({ message: "Server Create Successfully!" }),
);

app.listen(port, () => console.log(`Server running port on ${port}!`));

//          Database

app.post("/add-books", async (req, res) => {
  const bookCollection = await connectToMongoDB();
  const data = req.body;

  const result = await bookCollection.insertOne(data);
  res.send(result);
});
