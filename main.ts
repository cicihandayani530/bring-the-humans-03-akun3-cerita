// Entry program for the "Bring the humans with a TikTok ad" bounty.
//
// The whole job of this little program is to hand one thing to the
// grader: the address of the TikTok clip that belongs to this entry.
// The grader runs the program inside its own sandbox and tells it two
// folders through the environment:
//
//   MAKEFUN_BOT_DIR    where the bot's own files live (VIDEO.json sits here)
//   MAKEFUN_OUTPUT_DIR where the grader collects what the program emits
//
// So the flow is: read VIDEO.json from the bot folder, make sure the
// address inside is really a TikTok video address, then place a copy
// of the record into the output folder under the same name. Nothing
// here touches the network; it is plain Node standard library only.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const RECORD_NAME = "VIDEO.json";
const TIKTOK_PREFIX = "https://www.tiktok.com/";

function folderFromEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`environment variable ${name} is not set`);
  }
  return value;
}

function readClipRecord(botDir: string): { url: string } {
  const raw = readFileSync(join(botDir, RECORD_NAME), "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || !("url" in parsed)) {
    throw new Error(`${RECORD_NAME} does not hold a url field`);
  }
  const url = (parsed as { url: unknown }).url;
  if (typeof url !== "string") {
    throw new Error("the url in VIDEO.json is not a string");
  }
  // A stray space or newline around the address would send the grader
  // to a page that does not exist, so tidy it before trusting it.
  const cleaned = url.trim();
  if (!cleaned.startsWith(TIKTOK_PREFIX) || !cleaned.includes("/video/")) {
    throw new Error("the url in VIDEO.json is not a TikTok video address");
  }
  return { url: cleaned };
}

function deliverClipRecord(record: { url: string }, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, RECORD_NAME);
  writeFileSync(target, JSON.stringify(record) + "\n", "utf8");
  return target;
}

function run(): void {
  const botDir = folderFromEnv("MAKEFUN_BOT_DIR");
  const outDir = folderFromEnv("MAKEFUN_OUTPUT_DIR");
  const record = readClipRecord(botDir);
  const written = deliverClipRecord(record, outDir);
  console.log(`clip record delivered to ${written}`);
  console.log(`video: ${record.url}`);
}

run();
