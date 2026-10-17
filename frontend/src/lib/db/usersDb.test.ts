import { describe, it, expect, beforeEach } from "vitest";
import { UsersDatabase } from "./usersDb";

describe("UsersDatabase Authentication Engine", () => {
  beforeEach(() => {
    UsersDatabase._resetForTesting();
  });

  it("registers a new user with email and password", async () => {
    const { user, token } = await UsersDatabase.createUserWithPassword({
      name: "Rohit Malhotra",
      email: "rohit.m@example.com",
      password: "SecurePassword@2026"
    });

    expect(user.id).toMatch(/^USR-/);
    expect(user.email).toBe("rohit.m@example.com");
    expect(user.provider).toBe("EMAIL");
    expect(user.passwordHash).toBeDefined();
    expect(token).toBeDefined();

    const verified = UsersDatabase.verifySessionToken(token);
    expect(verified.valid).toBe(true);
    expect(verified.payload?.email).toBe("rohit.m@example.com");
  });

  it("validates correct email and password", async () => {
    const { user, token } = await UsersDatabase.validatePassword(
      "devansh.soni@gmail.com",
      "Password@123"
    );

    expect(user).toBeDefined();
    expect(user.email).toBe("devansh.soni@gmail.com");
    expect(token).toBeDefined();
  });

  it("rejects incorrect password", async () => {
    await expect(
      UsersDatabase.validatePassword("devansh.soni@gmail.com", "WrongPassword")
    ).rejects.toThrow(/Incorrect password/);
  });

  it("authenticates direct Google accounts", async () => {
    const { user, token } = await UsersDatabase.upsertGoogleUser({
      name: "Devansh Soni",
      email: "devansh.soni@gmail.com",
      googleId: "google-uid-12345",
      avatarUrl: "https://lh3.googleusercontent.com/photo.jpg"
    });

    expect(user.email).toBe("devansh.soni@gmail.com");
    expect(user.provider).toBe("GOOGLE");
    expect(user.avatarUrl).toBe("https://lh3.googleusercontent.com/photo.jpg");

    const session = UsersDatabase.verifySessionToken(token);
    expect(session.valid).toBe(true);
    expect(session.payload?.email).toBe("devansh.soni@gmail.com");
  });

  it("rejects invalid or tampered session tokens", () => {
    const result = UsersDatabase.verifySessionToken("invalid.token.here");
    expect(result.valid).toBe(false);
  });
});
