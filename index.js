import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.send({ message: "Server Create Successfully!" }),
);

app.listen(port, () => console.log(`Server running port on ${port}!`));
