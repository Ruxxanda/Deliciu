const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database("app.db");

let cachedProducts = null;
let lastFetch = 0;

db.run(`CREATE TABLE IF NOT EXISTS useri (
  uid TEXT PRIMARY KEY,
  nume TEXT,
  email TEXT,
  poza TEXT,
  telefon TEXT,
  adresa TEXT
)`, (err) => { if (err) console.log(err) });

db.run(`CREATE TABLE IF NOT EXISTS comentarii (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT,
  nume TEXT,
  poza TEXT,
  text TEXT
)`, (err) => { if (err) console.log(err) });

db.run(`CREATE TABLE IF NOT EXISTS salvari (
  uid TEXT,
  nume TEXT,
  PRIMARY KEY (uid, nume)
)`, (err) => { if (err) console.log(err) });

db.run(`CREATE TABLE IF NOT EXISTS cos (
  uid TEXT,
  nume TEXT,
  cantitate INTEGER,
  PRIMARY KEY (uid, nume)
)`, (err) => { 
  if (err) console.log(err);
  // Add pret column if not exists
  db.run(`ALTER TABLE cos ADD COLUMN pret REAL DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log(err);
    }
    // Add descriere column if not exists
    db.run(`ALTER TABLE cos ADD COLUMN descriere TEXT DEFAULT ''`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.log(err);
      }
    });
  });
});

// Comenzi
db.run(`CREATE TABLE IF NOT EXISTS comenzi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT,
  userData TEXT,
  cartData TEXT,
  status TEXT DEFAULT 'în desfășurare',
  message TEXT DEFAULT ''
)`, (err) => { if (err) console.log(err) });

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

app.listen(PORT, () => console.log("Server pornit pe http://localhost:3000"));


// la început, după celelalte require
const storage = multer.diskStorage({
  destination: path.join(__dirname, "pagini/pozeProduse"),
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, filename);
  }
});
const upload = multer({ storage });

// ENDPOINT: upload fișier (poza)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  // path relativ folosit de client
  const filePath = `pagini/pozeProduse/${req.file.filename}`;
  res.json({ status: "success", link: filePath });
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
      return res.status(500).json({error: err.message});
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

// API pentru produse din Google Sheets
app.get("/api/produse", async (req, res) => {
  const now = Date.now();
  if (cachedProducts && now - lastFetch < 0) { // cache disabled for testing
    res.json(cachedProducts);
  } else {
    try {
      const scriptURL = "https://script.google.com/macros/s/AKfycbyV45l-rcxgX8BB8zNvO8ilraCS91knt3iaUHQdbsXdZkpj9bD8Q0rgGnr-zAZgO45S4Q/exec";
      const response = await fetch(scriptURL);
      if (!response.ok) throw new Error('Google Sheets error: ' + response.status + ' ' + await response.text());
      const data = await response.json();
      cachedProducts = data;
      lastFetch = now;
      res.json(data);
    } catch (error) {
      console.log('Error fetching products:', error.message);
      if (cachedProducts) {
        res.json(cachedProducts); // return cached if error
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
});

// Salvari
app.post("/adaugaSalvare", (req, res) => {
  const { uid, nume } = req.body;
  db.run(`INSERT OR IGNORE INTO salvari(uid, nume) VALUES(?, ?)`,
    [uid, nume], err => {
      if (err) console.log(err);
      res.sendStatus(200);
    });
});

app.delete("/stergeSalvare/:uid/:nume", (req, res) => {
  db.run(`DELETE FROM salvari WHERE uid=? AND nume=?`,
    [req.params.uid, req.params.nume], err => {
      if (err) console.log(err);
      res.sendStatus(200);
    });
});

app.get("/salvari/:uid", (req, res) => {
  db.all(`SELECT nume FROM salvari WHERE uid=?`, [req.params.uid], (err, rows) => {
    res.json(rows.map(r => r.nume));
  });
});

// Cos
app.post("/adaugaCos", (req, res) => {
  const { uid, nume, cantitate, pret = 0, descriere = '' } = req.body;
  db.run(`INSERT OR REPLACE INTO cos(uid, nume, cantitate, pret, descriere) VALUES(?, ?, ?, ?, ?)`,
    [uid, nume, cantitate, pret, descriere], err => {
      if (err) console.log(err);
      res.sendStatus(200);
    });
});

app.delete("/stergeCos/:uid/:nume", (req, res) => {
  db.run(`DELETE FROM cos WHERE uid=? AND nume=?`,
    [req.params.uid, req.params.nume], err => {
      if (err) console.log(err);
      res.sendStatus(200);
    });
});

app.post("/updateCos", (req, res) => {
  const { uid, nume, cantitate } = req.body;
  db.run(`UPDATE cos SET cantitate = cantitate + ? WHERE uid=? AND nume=?`,
    [cantitate, uid, nume], function(err) {
      if (err) {
        console.log(err);
        return res.status(500).json({error: err.message});
      }
      res.sendStatus(200);
    });
});

app.get("/cos/:uid", (req, res) => {
  db.all(`SELECT nume, cantitate, pret, descriere FROM cos WHERE uid=?`, [req.params.uid], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// Comenzi
app.post("/placeOrder", (req, res) => {
  const { uid, user, cart } = req.body;
  db.run(`INSERT INTO comenzi(uid, userData, cartData) VALUES(?, ?, ?)`, [uid, JSON.stringify(user), JSON.stringify(cart)], err => {
    if (err) console.log(err);
    res.sendStatus(200);
  });
});

app.get("/comenzi", (req, res) => {
  db.all(`SELECT * FROM comenzi`, (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.get("/userComenzi/:uid", (req, res) => {
  db.all(`SELECT * FROM comenzi WHERE uid = ?`, [req.params.uid], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post("/updateComanda/:id", (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE comenzi SET status = ? WHERE id = ?`, [status, req.params.id], err => {
    if (err) console.log(err);
    res.sendStatus(200);
  });
});

app.delete("/comanda/:id", (req, res) => {
  db.run(`DELETE FROM comenzi WHERE id = ?`, [req.params.id], err => {
    if (err) console.log(err);
    res.sendStatus(200);
  });
});

// Adauga produs in Google Sheets
app.post("/addProduct", async (req, res) => {
  const { nume, descriere, linkImagine, pret } = req.body;
  const scriptURL = "https://script.google.com/macros/s/AKfycbyV45l-rcxgX8BB8zNvO8ilraCS91knt3iaUHQdbsXdZkpj9bD8Q0rgGnr-zAZgO45S4Q/exec";
  try {
    // Fetch current products to check for duplicate image
    const fetchResponse = await fetch(scriptURL);
    const products = await fetchResponse.json();
    const duplicate = products.some(p => p.imagine === linkImagine);
    if (duplicate) {
      return res.json({ status: "error", message: "Această imagine a fost deja folosită. Alegeți o altă imagine." });
    }
    // Proceed to add
    const formData = new URLSearchParams();
    formData.append('nume', nume);
    formData.append('descriere', descriere);
    formData.append('linkImagine', linkImagine);
    formData.append('pret', pret);
    const response = await fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});









