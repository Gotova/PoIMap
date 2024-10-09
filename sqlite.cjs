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
  const query = `
    SELECT 
      Marker.id, 
      Marker.Name, 
      Marker.xCoord, 
      Marker.yCoord, 
      Marker.Description, 
      Marker.Hidden, 
      Marker.CreationDate, 
      Marker.UpdateDate,
      MarkerType.id as TypeID,
      MarkerType.Name as TypeName,
      MarkerType.Color,
      MarkerType.Icon,
      QuestLine.id as QuestID,
      QuestLine.Name as QuestName,
      QuestLine.Description as QuestDescription,
      QuestLine.MainQuest
    FROM Marker
    LEFT JOIN MarkerType ON Marker.TypeID = MarkerType.id
    LEFT JOIN QuestLine ON Marker.QuestID = QuestLine.id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).send('Fehler beim Abrufen der Marker');
    }

    // Umstrukturierung der Daten in das gewünschte JSON-Format
    const result = rows.map(row => ({
      id: row.id,
      Name: row.Name,
      xCoord: row.xCoord,
      yCoord: row.yCoord,
      Description: row.Description,
      Hidden: row.Hidden,
      CreationDate: row.CreationDate,
      UpdateDate: row.UpdateDate,
      TypeID: row.TypeID,
      Type: {
        TypeName: row.TypeName,
        Color: row.Color,
        Icon: row.Icon
      },
      QuestID: row.QuestID,
      Quest: {
        QuestName: row.QuestName,
        QuestDescription: row.QuestDescription,
        MainQuest: row.MainQuest
      }
    }));

    res.json(result);
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
