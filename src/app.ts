import { Db } from "mongodb";
import { connectDB } from "./mongo";
import express from "express";
import { book, free, freeSeats, status, sigin, login, logout, mybookings } from "./resolvers";

const run = async () => {
  const db: Db = await connectDB();
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.set("db", db);

  var middleware = {
    logout: "/logout",
    freeseats: "/freeseats",
    book: "/book",
    free: "/free",
    mybookings: "/mybookings",
  };
  app.use([middleware.logout, middleware.freeseats,middleware.free,middleware.mybookings], async (req, res, next) => {
    console.log(req.query.token || "No token");
    console.log(req.headers["auth-token"]);
    const db: Db = req.app.get("db");
    const email = req.headers.email;
    const token = req.headers.token;
    if (!req.headers) return res.status(500).send("No params");
      if (!token || !email){
        return res.status(500).send("Missing email - token");
      }
      const user = await db
        .collection("Usuarios")
        .findOne({ email: email, token: token });
      if (user) {
        console.log("Acceso permitido.");
        next();
      } else {
        console.log("Acceso no permitido.");
        res.send("Error");
      }
  });

  app.get("/status", status);
  app.get("/freeSeats", freeSeats);
  app.post("/book", book);
  app.post("/free", free);

  app.post("/sigin", sigin);
  app.post("/login", login);
  app.post("/logout", logout);
  app.get("/mybookings", mybookings);

  await app.listen(3000);
};

try {
  run();
} catch (e) {
  console.error(e);
}
