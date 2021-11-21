import { Request, Response } from "express";
import { Db } from "mongodb";
import { isConstructorDeclaration } from "typescript";
import { v4 as uuid } from "uuid";

const checkDateValidity = (
  day: string,
  month: string,
  year: string
): boolean => {
  const date = new Date(`${month} ${day}, ${year}`);
  return date.toString() !== "Fecha no valida.";
};

export const status = async (req: Request, res: Response) => {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  res.status(200).send(`${day}-${month}-${year}`);
};

export const freeSeats = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("Puestos");

  if (!req.query) {
    return res.status(500).send("Sin parametros");
  }

  const { day, month, year } = req.query as {
    day: string;
    month: string;
    year: string;
  };

  if (!day || !month || !year) {
    return res.status(500).send("Falta el día, el mes o el año.");
  }

  if (!checkDateValidity(day, month, year)) {
    return res.status(500).send("Día, mes o año no válidos.");
  }

  const seats = await collection.find({ day, month, year }).toArray();

  const freeSeats = [];
  for (let i = 1; i <= 20; i++) {
    if (!seats.find((seat) => parseInt(seat.number) === i)) {
      freeSeats.push(i);
    }
  }
  return res.status(200).json({ free: freeSeats });
};

export const book = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("Puestos");
  if (!req.query) {
    return res.status(500).send("Sin parametros.");
  }

  const { day, month, year, number } = req.query as {
    day: string;
    month: string;
    year: string;
    number: string;
  };

  if (!day || !month || !year || !number) {
    return res.status(500).send("Falta el día, el mes o el año o el número de asiento.");
  }

  if (!checkDateValidity(day, month, year)) {
    return res.status(500).send("Día, mes o año no válidos.");
  }

  const notFree = await collection.findOne({ day, month, year, number });
  if (notFree) {
    return res.status(404).send("El puesto no está libre.");
  }

  //Coge el token de el usuario.
  const token = req.headers.token;
  await collection.insertOne({ day, month, year, number, token });

  return res.status(200).json({ token });
};

export const free = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("Puestos");
  if (!req.body) {
    return res.status(500).send("Sin parametros.");
  }

  const { day, month, year } = req.body as {
    day: string;
    month: string;
    year: string;
  };

  const token = req.body.token;
  if (!day || !month || !year || !token) {
    return res
      .status(500)
      .send("Falta el día, el mes o el año o el número de asiento o la ficha.");
  }
  
  if (!checkDateValidity(day, month, year)) {
    return res.status(500).send("Día, mes o año no válidos.");
  }
  
  const tokenuser = req.headers.token;
  if(token !== tokenuser){
    return res.status(404).send("No reservaste nada.");
  }

  const booked = await collection.findOne({ day, month, year, token });
  if (booked) {
    await collection.deleteOne({ day, month, year, token });
    return res.status(200).send("El puesto está libre.");
  }

  return res.status(404).send("El puesto no está reservado.");
};

export const sigin = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const body = req.body;
  const validator = await db
    .collection("Usuarios")
    .findOne({ email: body.email });
  if (!validator) {
    await db.collection("Usuarios").insertOne({
      email: body.email,
      password: body.password,
      token: undefined,
    });
    return res.status(200).json({
      email: body.email,
      password: body.password,
    });
  } else {
    return res.status(409).json({
      Error: "Ya existe el usuario",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("Usuarios");
  const body = req.body;
  const token = uuid();

  const check = await db
    .collection("Usuarios")
    .findOne({ email: body.email, password: body.password, token: undefined });

  if (check) {
    await db
      .collection("Usuarios")
      .updateOne({ email: body.email }, { $set: { token: token } });
    return res.status(200).json({
      email: body.email,
      password: body.password,
      token: body.token,
    });
  } else {
    return res.status(401).json({
      Error: "Error",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("Usuarios");
  const body = req.body;

  const check = await db
    .collection("Usuarios")
    .findOne({ email: body.email, password: body.password, token: body.token });
  if (check) {
    await db
      .collection("Usuarios")
      .updateOne({ email: body.email }, { $set: { token: undefined } });
    return res.status(200).json({
      email: body.email,
      password: body.password
    });
  } else {
    return res.status(500).json({
      Error: "Error, no existes.",
    });
  }
};
export const mybookings = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("Puestos").find().toArray();
  const tokenUser = req.headers.token;
  const arr:{day:any, month:string, year:string, number:string, token: string}[] = [];

  (await collection).forEach((elem) => {
    if(elem.token === tokenUser){
      arr.push(elem.day, elem.month, elem.year, elem.number, elem.token);
    }
  });

  if(arr.length < 0){
    return res.status(404).send("No tienes reservas.");
  }

  return res.status(200).json({ seats: arr });
};