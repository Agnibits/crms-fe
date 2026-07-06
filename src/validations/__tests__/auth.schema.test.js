import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
} from "../auth.schema";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "secret" });
    expect(result.success).toBe(true);
  });
  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "secret" });
    expect(result.success).toBe(false);
  });
  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Jane Doe",
    email: "jane@corp.com",
    password: "Password1",
    confirmPassword: "Password1",
    acceptTerms: true,
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("enforces password complexity", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "weakpass", confirmPassword: "weakpass" }).success
    ).toBe(false);
  });

  it("requires matching passwords", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Password2" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain("confirmPassword");
  });

  it("requires accepted terms", () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("requires new passwords to match", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "x@y.io" }).success).toBe(true);
  });
});
