const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('database.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS MarkerType (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Color TEXT NOT NULL,
    Icon TEXT
  );`);
  db.run(`
    CREATE TABLE IF NOT EXISTS QuestLine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Description TEXT,
    MainQuest BOOLEAN NOT NULL
  )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS Marker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    TypeID INTEGER,
    QuestID INTEGER,
    xCoord REAL NOT NULL,
    yCoord REAL NOT NULL,
    Description TEXT,
    Hidden BOOLEAN NOT NULL DEFAULT 0,
    CreationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdateDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TypeID) REFERENCES MarkerType(id),
    FOREIGN KEY (QuestID) REFERENCES QuestLine(id)
  )`);
});

app.post('/api/markertypes', (req, res) => {
  const { Name, Color, Icon } = req.body;
  db.run(
    'INSERT INTO MarkerType (Name, Color, Icon) VALUES (?, ?, ?)',
    [Name, Color, Icon],
    function (err) {
      if (err) {
        return res.status(500).send('Fehler beim Hinzufügen des MarkerType-Eintrags');
      }
      res.json({ id: this.lastID, Name, Color, Icon });
    }
  );
});

app.get('/api/markertypes', (req, res) => {
  db.all('SELECT * FROM MarkerType', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Fehler beim Abrufen der MarkerType-Einträge');
    }
    res.json(rows);
  });
});

app.get('/api/markertypes/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM MarkerType WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).send('Fehler beim Abrufen des MarkerType-Eintrags');
    }
    if (!row) {
      return res.status(404).send('MarkerType nicht gefunden');
    }
    res.json(row);
  });
});

app.post('/api/questlines', (req, res) => {
  const { Name, Description, MainQuest } = req.body;
  db.run(
    'INSERT INTO QuestLine (Name, Description, MainQuest) VALUES (?, ?, ?)',
    [Name, Description, MainQuest],
    function (err) {
      if (err) {
        return res.status(500).send('Fehler beim Hinzufügen des QuestLine-Eintrags');
      }
      res.json({ id: this.lastID, Name, Description, MainQuest });
    }
  );
});

app.get('/api/questlines', (req, res) => {
  db.all('SELECT * FROM QuestLine', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Fehler beim Abrufen der QuestLine-Einträge');
    }
    res.json(rows);
  });
});

app.post('/api/markers', (req, res) => {
  const { Name, TypeID, QuestID, xCoord, yCoord, Description, Hidden } = req.body;
  db.run(
    'INSERT INTO Marker (Name, TypeID, QuestID, xCoord, yCoord, Description, Hidden) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [Name, TypeID, QuestID, xCoord, yCoord, Description, Hidden],
    function (err) {
      if (err) {
        return res.status(500).send('Fehler beim Hinzufügen des Markers');
      }
      res.json({ id: this.lastID, Name, TypeID, QuestID, xCoord, yCoord, Description, Hidden});
    }
  );
});

app.get('/api/markers', (req, res) => {
  db.all('SELECT * FROM Marker', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Fehler beim Abrufen der Markers');
    }
    res.json(rows);
    
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
