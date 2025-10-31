const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database("app.db");

db.run(`CREATE TABLE IF NOT EXISTS useri (
  uid TEXT PRIMARY KEY,
  nume TEXT,
  email TEXT,
  poza TEXT,
  telefon TEXT,
  adresa TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS comentarii (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT,
  nume TEXT,
  poza TEXT,
  text TEXT
)`);

// salvare user
app.post("/salveazaUser", (req, res) => {
  const { uid, nume, email, poza } = req.body;
  db.run(`INSERT OR IGNORE INTO useri(uid,nume,email,poza) VALUES(?,?,?,?)`,
    [uid, nume, email, poza], err => {
      if (err) console.log(err);
      res.sendStatus(200);
    });
});

// date user
app.get("/user/:uid", (req, res) => {
  db.get(`SELECT * FROM useri WHERE uid=?`, [req.params.uid], (err, row) => {
    res.json(row || {});
  });
});

// comentarii publice
app.get("/comentarii", (req, res) => {
  db.all(`SELECT * FROM comentarii`, (err, rows) => res.json(rows));
});

// comentarii user
app.get("/comentariiUser/:uid", (req, res) => {
  db.all(`SELECT * FROM comentarii WHERE uid=?`, [req.params.uid], (err, rows) => res.json(rows));
});

// adaugare comentariu
app.post("/adaugaComentariu", (req, res) => {
  const { uid, text } = req.body;
  db.get(`SELECT * FROM useri WHERE uid=?`, [uid], (err, u) => {
    if (!u) return res.sendStatus(404);
    db.run(`INSERT INTO comentarii(uid,nume,poza,text) VALUES(?,?,?,?)`,
      [uid, u.nume, u.poza, text], err2 => {
        if (err2) console.log(err2);
        res.sendStatus(200);
      });
  });
});

// stergere comentariu
app.delete("/stergeComentariu/:id", (req, res) => {
  db.run(`DELETE FROM comentarii WHERE id=?`, [req.params.id], err => res.sendStatus(200));
});

app.listen(3000, () => console.log("Server pornit pe http://localhost:3000"));


// la început, după celelalte require
const multer = require("multer");
const upload = multer({ dest: path.join(__dirname, "uploads") });

// ENDPOINT: upload fișier (poza)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  // path relativ folosit de client
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ path: filePath });
});

// ENDPOINT: update user (edit)
app.post("/updateUser", (req, res) => {
  const { uid, nume, email, telefon, adresa, poza } = req.body;

  // 1. actualizează userul
  const queryUser = `UPDATE useri SET 
    nume=?, email=?, telefon=?, adresa=?, poza=COALESCE(?,poza) 
    WHERE uid=?`;

  db.run(queryUser, [nume, email, telefon, adresa, poza, uid], function(err){
    if(err){
      console.log(err);
      return res.sendStatus(500);
    }

    // 2. actualizează toate comentariile existente ale userului
    const queryComent = `UPDATE comentarii SET 
      nume=?, poza=COALESCE(?,poza) 
      WHERE uid=?`;
    
    db.run(queryComent, [nume, poza, uid], function(err2){
      if(err2) console.log(err2);
      res.sendStatus(200);
    });
  });
});


// ENDPOINT: toate userii (pentru admin)
app.get("/allUsers", (req, res) => {
  db.all(`SELECT * FROM useri`, (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

// ENDPOINT: sterge user (optional)
app.delete("/deleteUser/:uid", (req, res) => {
  db.run(`DELETE FROM useri WHERE uid=?`, [req.params.uid], err => {
    if (err) console.log(err);
    // șterge comentariile lui
    db.run(`DELETE FROM comentarii WHERE uid=?`, [req.params.uid], err2 => {
      res.sendStatus(200);
    });
  });
});


// update comentariu user
app.post("/updateComentariu/:id", (req,res)=>{
  const { text } = req.body;
  db.run(`UPDATE comentarii SET text=? WHERE id=?`, [text, req.params.id], err=>{
    if(err) console.log(err);
    res.sendStatus(200);
  });
});



const PORT = process.env.PORT || 3000;












// ENDPOINT: upload imagine produs în pozeProduse
const multerProd = require("multer");
const pathProd = require("path");

// configurare multer pentru folder pozeProduse
const uploadProd = multer({
  storage: multer.diskStorage({
    destination: pathProd.join(__dirname, "pagini", "pozeProduse"),
    filename: (req, file, cb) => {
      const ext = pathProd.extname(file.originalname);
      const name = file.fieldname + "-" + Date.now() + ext;
      cb(null, name);
    }
  })
});

app.post("/uploadProdus", uploadProd.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });

  // link relativ pentru admin + produse.html
  const filePath = `pozeProduse/${req.file.filename}`;
  res.json({ path: filePath });
});

