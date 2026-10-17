/**
 * Route Sense Mumbai — User Authentication & Account Database Engine
 * Implements persistent storage for email/password and direct Google Sign-in accounts,
 * PBKDF2 salted password cryptography, and HMAC-SHA256 session token management.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  avatarUrl?: string;
  provider: "EMAIL" | "GOOGLE";
  googleId?: string;
  role: "COMMUTER" | "STAFF" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  provider: "EMAIL" | "GOOGLE";
  role: "COMMUTER" | "STAFF" | "ADMIN";
  iat: number;
  exp: number;
}

interface UserDatabaseSchema {
  users: Record<string, UserRecord>;
}

const memoryStore: UserDatabaseSchema = {
  users: {}
};

let isInitialized = false;
let lastLoadedMtime = 0;

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SECRET_KEY || "routesense-mumbai-auth-secret-key-2026";

function getDbFilePath(): string {
  const localDir = path.join(process.cwd(), "data");
  const localPath = path.join(localDir, "routesense_users.json");

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.writeFileSync(path.join(localDir, ".user_write_test"), "ok");
    fs.unlinkSync(path.join(localDir, ".user_write_test"));
    return localPath;
  } catch {
    const tmpDir = path.join(process.platform === "win32" ? process.env.TEMP || "C:\\temp" : "/tmp", "routesense");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.join(tmpDir, "routesense_users.json");
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function seedDefaultUsers(): void {
  const defaultSalt = "routesense_mumbai_salt_2026";
  const defaultPassword = "Password@123";
  const defaultHash = hashPassword(defaultPassword, defaultSalt);

  const initialUsers: UserRecord[] = [
    {
      id: "USR-DEV-001",
      name: "Devansh R. Soni",
      email: "devansh.soni@gmail.com",
      passwordHash: defaultHash,
      salt: defaultSalt,
      avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
      provider: "GOOGLE",
      googleId: "google-devansh-soni-101",
      role: "COMMUTER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "USR-COMM-002",
      name: "Aarav Sharma",
      email: "aarav.sharma@gmail.com",
      passwordHash: defaultHash,
      salt: defaultSalt,
      provider: "EMAIL",
      role: "COMMUTER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "USR-STAFF-003",
      name: "V. K. Shinde",
      email: "conductor.shinde@best.gov.in",
      passwordHash: defaultHash,
      salt: defaultSalt,
      provider: "EMAIL",
      role: "STAFF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const u of initialUsers) {
    if (!memoryStore.users[u.email.toLowerCase()]) {
      memoryStore.users[u.email.toLowerCase()] = u;
    }
  }
}

function loadFromDisk(): void {
  try {
    const dbPath = getDbFilePath();
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.users) memoryStore.users = parsed.users;
      const stat = fs.statSync(dbPath);
      lastLoadedMtime = stat.mtimeMs;
    }
  } catch (err) {
    console.warn("Could not load user store from disk:", err);
  }

  seedDefaultUsers();
  isInitialized = true;
}

function persistToDisk(): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }
  try {
    const dbPath = getDbFilePath();
    const data = JSON.stringify(memoryStore, null, 2);
    fs.writeFileSync(dbPath, data, "utf-8");
    try {
      const stat = fs.statSync(dbPath);
      lastLoadedMtime = stat.mtimeMs;
    } catch {
      lastLoadedMtime = Date.now();
    }
  } catch (err) {
    console.warn("Could not persist user store to disk:", err);
  }
}

function ensureInit(): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    if (!isInitialized) {
      loadFromDisk();
    }
    return;
  }

  try {
    const dbPath = getDbFilePath();
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      if (!isInitialized || stat.mtimeMs > lastLoadedMtime) {
        loadFromDisk();
        lastLoadedMtime = stat.mtimeMs;
      }
    } else if (!isInitialized) {
      loadFromDisk();
    }
  } catch {
    if (!isInitialized) {
      loadFromDisk();
    }
  }
}

export const UsersDatabase = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    ensureInit();
    return memoryStore.users[email.toLowerCase().trim()] || null;
  },

  async findById(id: string): Promise<UserRecord | null> {
    ensureInit();
    return Object.values(memoryStore.users).find((u) => u.id === id) || null;
  },

  async createUserWithPassword(params: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: UserRecord; token: string }> {
    ensureInit();
    const cleanEmail = params.email.toLowerCase().trim();

    if (memoryStore.users[cleanEmail]) {
      throw new Error("An account with this email address already exists. Please sign in.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(params.password, salt);
    const now = new Date().toISOString();
    const id = `USR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const user: UserRecord = {
      id,
      name: params.name.trim(),
      email: cleanEmail,
      passwordHash,
      salt,
      provider: "EMAIL",
      role: "COMMUTER",
      createdAt: now,
      updatedAt: now
    };

    memoryStore.users[cleanEmail] = user;
    persistToDisk();

    const token = UsersDatabase.issueSessionToken(user);
    return { user, token };
  },

  async validatePassword(email: string, password: string): Promise<{ user: UserRecord; token: string }> {
    ensureInit();
    const cleanEmail = email.toLowerCase().trim();
    const user = memoryStore.users[cleanEmail];

    if (!user) {
      throw new Error("No account found with this email. Please check your email or create a new account.");
    }

    if (user.provider === "GOOGLE" && !user.passwordHash) {
      throw new Error("This account was created with Google. Please use 'Sign in with Google'.");
    }

    if (!user.passwordHash || !user.salt) {
      throw new Error("Invalid password authentication configuration.");
    }

    const hash = hashPassword(password, user.salt);
    const match = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash));

    if (!match) {
      throw new Error("Incorrect password. Please try again or use Google sign in.");
    }

    const token = UsersDatabase.issueSessionToken(user);
    return { user, token };
  },

  /**
   * Upsert direct Google authenticated user
   */
  async upsertGoogleUser(params: {
    name: string;
    email: string;
    avatarUrl?: string;
    googleId?: string;
  }): Promise<{ user: UserRecord; token: string }> {
    ensureInit();
    const cleanEmail = params.email.toLowerCase().trim();
    let user = memoryStore.users[cleanEmail];
    const now = new Date().toISOString();

    if (user) {
      user.name = params.name.trim() || user.name;
      if (params.avatarUrl) user.avatarUrl = params.avatarUrl;
      if (params.googleId) user.googleId = params.googleId;
      user.updatedAt = now;
    } else {
      const id = `USR-GGL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      user = {
        id,
        name: params.name.trim() || "Google User",
        email: cleanEmail,
        avatarUrl: params.avatarUrl,
        provider: "GOOGLE",
        googleId: params.googleId || `ggl_${Date.now()}`,
        role: "COMMUTER",
        createdAt: now,
        updatedAt: now
      };
      memoryStore.users[cleanEmail] = user;
    }

    persistToDisk();
    const token = UsersDatabase.issueSessionToken(user);
    return { user, token };
  },

  issueSessionToken(user: UserRecord): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 7 * 24 * 3600; // 7 days validity

    const payload: SessionPayload = {
      uid: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      role: user.role,
      iat: issuedAt,
      exp: expiresAt
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    return `${payloadBase64}.${signature}`;
  },

  verifySessionToken(token: string): { valid: boolean; payload?: SessionPayload; reason?: string } {
    try {
      const parts = token.trim().split(".");
      if (parts.length !== 2) {
        return { valid: false, reason: "Malformed session token" };
      }

      const [payloadBase64, signature] = parts;
      const expectedSignature = crypto
        .createHmac("sha256", AUTH_SECRET)
        .update(payloadBase64)
        .digest("base64url");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return { valid: false, reason: "Invalid session token signature" };
      }

      const payload: SessionPayload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8"));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && now > payload.exp) {
        return { valid: false, reason: "Session expired. Please sign in again." };
      }

      return { valid: true, payload };
    } catch (err: any) {
      return { valid: false, reason: err?.message || "Invalid session encoding" };
    }
  },

  _resetForTesting(): void {
    memoryStore.users = {};
    seedDefaultUsers();
    isInitialized = true;
    lastLoadedMtime = Date.now() + 1000000;
  }
};
