import express from "express";
import { Express, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import cors from "cors"
import mongoose from "mongoose";
import "dotenv/config";
const app: Express = express();
const jwtpwd = process.env.jwtpwd as string ;
app.use(cors())
app.use(express.json());
const schemaObj = new mongoose.Schema({
  title: String,
  description: String,
  status: {
    type: String,
    enum: ["todo", "inprogress", "completed"],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low",
  },
  duedate: Date,
});
const schema = new mongoose.Schema({
  username: String,
  password: String,
  notes: [schemaObj],
});

const Usernote = mongoose.model("Usernote", schema);
const constr: string = String(process.env.mongodbstr);
mongoose
  .connect(constr)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Database connection error:", err));
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  const username:string = req.body.username;
  const password:string = req.body.password;
  const f = await Usernote.findOne({ username: username });
  if (f) {
    res.status(403).json({ msg: "User already present " });

    return;
  } else {
    await Usernote.create({
      username: username,
      password: password,
      notes: [],
    });

    res.status(200).json({ msg: "New user id created" });
  }
});
app.post("/api/auth/login", async (req: Request, res: Response) => {
  if (!req.body.username || !req.body.password)
    res.status(403).json({ msg: "Insufficient Credential" });
  else {
    const ispresent:boolean = await userpresence(req.body.username, req.body.password);
    if (ispresent) {
      const token = jwt.sign({ username: req.body.username }, jwtpwd, {
        expiresIn: "1d",
      });

      res.status(200).json({ token });
    } else {
      res.status(403).json({ msg: "User Not Found" });
    }
  }
});
async function userpresence(name: string, pwd: string) {
  const f = await Usernote.findOne({ username: name });
  if (f) return true;
  return false;
}

app.get("/api/notes", async (req: Request, res: Response) => {
  const token: any = (req.headers.token);
  try {
    const decoded: any = jwt.verify(token, jwtpwd);
    let a = await Usernote.findOne({ username: decoded.username });
    if(a)
    res.json({ notes: a.notes });
  } catch (err) {
    res.status(403).json({ msg: "User not authenticated" });
  }
});

app.put("/api/notes/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const token: string = String(req.headers.token);
  const note = { ...req.body };
  try {
    let v: any = jwt.verify(token, jwtpwd);
    const a:any = await Usernote.findOne({ username: v.username });
    let notes: any = a.notes;
    for (let i = 0; i < notes.length; i++) {  
      const cur = notes[i]._id.toString();
      if (cur.includes(id)) {
        notes[i].status = note.status;
        notes[i].title = note.title
        notes[i].description = note.description
        notes[i].priority = note.priority;
        notes[i].duedate = note.duedate;
      }
    }

    await Usernote.updateOne({ username: v.username }, { notes: notes });
    res.status(200).json({ msg: "Notes updated" });
  } catch (err) {
    res.status(403).json({ msg: "User does not exists" });
  }
});

app.delete("/api/notes/:id", async (req: Request, res: Response) => {
  const id: string = req.params.id;

  const token: string = String(req.headers.token);
  try {
    let v: any = jwt.verify(token, jwtpwd);
    const a: any = await Usernote.findOne({ username: v.username });
    let no:any = [];
    a.notes.forEach((i: any) => {
      const newid: string = i._id.toString();
      if (!newid.includes(id)) {
        no.push(i);
      }
    });
    await Usernote.updateOne({ username: v.username }, { notes: no });
    res.status(200).json({ msg: "Note deleted" });
  } catch (err) {
    res.status(403).json({ msg: "User does not exists" });
  }
});

app.post("/api/notes", async (req: Request, res: Response) => {
  const token: string = String(req.headers.token);
  const note = { ...req.body };

  //contains the text part of data and req.file contains the file part
  try {
    const decoded: any = jwt.verify(token, jwtpwd);

    let a: any = await Usernote.findOne({ username: decoded.username });
    a.notes.push(note);
    await Usernote.updateOne(
      { username: decoded.username },
      { notes: a.notes }
    );

    res.status(200).json({ msg: "Notes added..." });
  } catch (err) {
    res.status(403).json({ msg: "User not authenticated" });
  }
});
app.get("/api/getName",(req:Request,res:Response)=>{
  const token:string = String(req.headers.token)
  try{
    const resp:any = jwt.verify(token,jwtpwd)
    res.status(200).json({name:resp.username})
  }catch(err){
    console.log(err)
    res.status(403).json({msg:err})
  }
})
app.listen(3000, () => {
  console.log("Listening on port 3000");
});

const url = "https://taskmanger-backend.onrender.com"

function reloadWebsite() {
    fetch(url)
    .then(response => {
        console.log(response.status);
    })
    .catch(error => {
        console.error(error.message);
    });
}

setInterval(reloadWebsite, 30000);
