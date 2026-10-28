import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const sourceArg = process.argv[2];
const sourcePath = sourceArg
  ? path.resolve(process.cwd(), sourceArg)
  : path.resolve(appRoot, "..", "curriculum", "complete-curriculum.md");
const outDir = path.resolve(appRoot, "src", "data");
const outPath = path.resolve(outDir, "curriculum.json");

if (!fs.existsSync(sourcePath)) {
  console.error(`Curriculum file not found: ${sourcePath}`);
  console.error(
    "Usage: npm run import:curriculum -- path/to/complete-curriculum.md",
  );
  process.exit(1);
}

const markdown = fs.readFileSync(sourcePath, "utf8");
const lines = markdown.replace(/\r\n/g, "\n").split("\n");

const clean = (value) =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");

const topics = [];
const tracks = [];
let currentTrack = null;
let table = null;
const seenIds = new Map();

const makeId = (prefix, title) => {
  const base = `${prefix}-${slugify(title)}`;
  const count = seenIds.get(base) ?? 0;
  seenIds.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
};

for (const line of lines) {
  const trackMatch = /^## Track (\d+): (.+)$/.exec(line.trim());
  if (trackMatch) {
    currentTrack = { id: Number(trackMatch[1]), name: clean(trackMatch[2]) };
    tracks.push(currentTrack);
    table = null;
    continue;
  }

  if (!currentTrack) continue;

  if (line.startsWith("| Topic | Depth | Notes |")) {
    table = "topic";
    continue;
  }

  if (line.startsWith("| Order | Language | Depth | Role |")) {
    table = "language";
    continue;
  }

  if (!line.startsWith("|")) {
    table = null;
    continue;
  }

  if (/^\|[\s:|-]+\|$/.test(line.trim())) continue;
  if (!table) continue;

  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => clean(cell));

  if (table === "topic" && cells.length >= 3) {
    const [title, depth, notes] = cells;
    if (!title || !depth) continue;
    topics.push({
      id: makeId(`t${currentTrack.id}`, title),
      title,
      trackId: currentTrack.id,
      track: currentTrack.name,
      depth,
      notes: notes === "—" ? "" : notes,
      kind: "topic",
    });
  }

  if (table === "language" && cells.length >= 4) {
    const [, language, depth, role] = cells;
    if (!language || !depth) continue;
    topics.push({
      id: makeId(`t${currentTrack.id}-language`, language),
      title: language,
      trackId: currentTrack.id,
      track: currentTrack.name,
      depth,
      notes: role === "—" ? "" : `Language sequence. ${role}`,
      kind: "language",
    });
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      source: path.relative(appRoot, sourcePath).split(path.sep).join("/"),
      importedAt: new Date().toISOString(),
      tracks,
      topics,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`Imported ${topics.length} cards from ${tracks.length} tracks.`);
console.log(`Wrote ${path.relative(appRoot, outPath)}.`);
