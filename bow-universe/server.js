const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { people, connections } = require("./src/seed");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "250kb" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: 0 }));

const pendingConnections = [];

app.get("/api/universe", (_req, res) => {
  res.json({ people, connections: connections.filter((edge) => edge.status === "confirmed") });
});

app.post("/api/profiles", (req, res) => {
  const { name, school, year, major, bio = "", interests = [], skills = [] } = req.body || {};
  if (!name || !["Babson", "Olin", "Wellesley"].includes(school) || !year || !major) {
    return res.status(400).json({ error: "Name, school, year, and major are required." });
  }
  const profile = {
    id: crypto.randomUUID(), name: String(name).slice(0, 80), school,
    year: String(year).slice(0, 4), major: String(major).slice(0, 100),
    bio: String(bio).slice(0, 280), interests, skills,
    role: "New to the universe", leadership: [], projects: [], organizations: [], links: {},
    image: "", color: school === "Babson" ? "#74d6bb" : school === "Olin" ? "#f4a6c1" : "#b7a7ff"
  };
  people.push(profile);
  res.status(201).json({ profile, message: "Welcome to the BOW universe." });
});

app.post("/api/connections", (req, res) => {
  const { from, to, relationshipType, context = "" } = req.body || {};
  if (!from || !to || from === to || !relationshipType) {
    return res.status(400).json({ error: "Choose two different people and a relationship." });
  }
  const request = { id: crypto.randomUUID(), from, to, relationshipType, context, status: "pending", createdAt: new Date().toISOString() };
  pendingConnections.push(request);
  res.status(201).json({ request, message: "Connection request sent for confirmation." });
});

app.get("/health", (_req, res) => res.json({ ok: true, people: people.length }));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`BOW Universe listening on ${port}`));
