const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function cleanText(value, maxLength = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

app.get("/api/items", (req, res) => {
  res.json(readDB().items);
});

app.post("/api/items", (req, res) => {
  const name = cleanText(req.body.name, 80);
  const category = cleanText(req.body.category, 40);
  const description = cleanText(req.body.description, 300);
  const owner = cleanText(req.body.owner, 50);
  const image = cleanText(req.body.image, 500);

  if (!name || !category || !description || !owner) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }

  if (image) {
    try {
      const url = new URL(image);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid URL");
    } catch {
      return res.status(400).json({ message: "Please provide a valid image URL." });
    }
  }

  const db = readDB();
  const newItem = {
    id: Date.now(), name, category, description, owner, image,
    available: true, createdAt: new Date().toISOString()
  };
  db.items.unshift(newItem);
  writeDB(db);
  res.status(201).json(newItem);
});

app.delete("/api/items/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  if (!db.items.some(item => item.id === id)) {
    return res.status(404).json({ message: "Item not found." });
  }
  db.items = db.items.filter(item => item.id !== id);
  db.requests = db.requests.filter(request => request.itemId !== id);
  writeDB(db);
  res.json({ message: "Item deleted successfully." });
});

app.get("/api/requests", (req, res) => {
  res.json(readDB().requests);
});

app.post("/api/requests", (req, res) => {
  const itemId = Number(req.body.itemId);
  const borrower = cleanText(req.body.borrower, 50);

  if (!Number.isSafeInteger(itemId) || !borrower) {
    return res.status(400).json({ message: "Invalid request details." });
  }

  const db = readDB();
  const item = db.items.find(entry => entry.id === itemId);
  if (!item) return res.status(404).json({ message: "Item not found." });
  if (!item.available) return res.status(400).json({ message: "This item is not currently available." });
  if (item.owner.toLowerCase() === borrower.toLowerCase()) {
    return res.status(400).json({ message: "You cannot borrow your own item." });
  }

  const duplicate = db.requests.some(request =>
    request.itemId === itemId &&
    request.borrower.toLowerCase() === borrower.toLowerCase() &&
    request.status === "Pending"
  );
  if (duplicate) return res.status(409).json({ message: "You already have a pending request." });

  const newRequest = {
    id: Date.now(), itemId, itemName: item.name, owner: item.owner,
    borrower, status: "Pending", createdAt: new Date().toISOString()
  };
  db.requests.unshift(newRequest);
  writeDB(db);
  res.status(201).json(newRequest);
});

app.patch("/api/requests/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  const status = req.body.status;

  if (!["Accepted", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid request status." });
  }

  const request = db.requests.find(entry => entry.id === id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  if (request.status !== "Pending") {
    return res.status(400).json({ message: "This request has already been processed." });
  }

  const item = db.items.find(entry => entry.id === request.itemId);
  if (status === "Accepted") {
    if (!item || !item.available) {
      return res.status(400).json({ message: "This item is no longer available." });
    }
    item.available = false;
  }

  request.status = status;
  writeDB(db);
  res.json({ message: `Request ${status.toLowerCase()} successfully.`, request });
});

app.listen(PORT, () => {
  console.log(`NeighborShare running at http://localhost:${PORT}`);
});
