#!/usr/bin/env node
/*
 * One-time (or as-needed) account setup for either role.
 * Creates a new user, or resets the password/role of an existing one.
 *
 * Usage:
 *   npm run create-admin
 *
 * Reads MONGODB_URI from .env.local (or the environment) and prompts for
 * username + password + role. Nothing is printed or logged from the password input.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const KEY_ENTER_LF = String.fromCharCode(10);
const KEY_ENTER_CR = String.fromCharCode(13);
const KEY_CTRL_C = String.fromCharCode(3);
const KEY_CTRL_D = String.fromCharCode(4);
const KEY_BACKSPACE = String.fromCharCode(127);
const KEY_BACKSPACE_ALT = String.fromCharCode(8);

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);

    let input = "";
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");

    const onData = (char) => {
      if (char === KEY_ENTER_LF || char === KEY_ENTER_CR || char === KEY_CTRL_D) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
      } else if (char === KEY_CTRL_C) {
        process.stdout.write("\n");
        process.exit(1);
      } else if (char === KEY_BACKSPACE || char === KEY_BACKSPACE_ALT) {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set (checked .env.local and the environment). Aborting.");
    process.exit(1);
  }

  const username = (await prompt("Username: ")).toLowerCase();
  if (!username) {
    console.error("Username is required.");
    process.exit(1);
  }

  const password = await promptHidden("Password: ");
  if (!password || password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const confirm = await promptHidden("Confirm password: ");
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  const roleInput = (await prompt("Role (admin/viewer) [admin]: ")).toLowerCase();
  const role = roleInput === "viewer" ? "viewer" : "admin";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db.collection("users").findOne({ username });

  await db.collection("users").updateOne(
    { username },
    { $set: { username, passwordHash, role }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  console.log(existing ? `Updated "${username}" (role: ${role}).` : `Created "${username}" (role: ${role}).`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
