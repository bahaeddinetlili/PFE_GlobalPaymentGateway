import express from "express";

import cors from "cors";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import connectDb from "./config/db.js";

const app = express();
dotenv.config();
const hostname = process.env.DEVURL;
const port = process.env.PORT||8080;

//Connexion lel base fi config/db.js
connectDb(); 

app.use(cors());
app.use("/media", express.static("media"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/user", userRoutes);

// npm run dev bech texecuti
app.listen(port, hostname, () => {
  console.log(`Server running on ${hostname}:${port}`);
});