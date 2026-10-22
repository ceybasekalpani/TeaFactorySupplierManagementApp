import { z } from "zod";

export function buildLoginSchema(t) {
  return z.object({
    username: z.string().trim().min(1, t.usernameRequired).max(100, t.usernameTooLong || "Username is too long"),
    password: z.string().min(1, t.passwordRequired).max(128, t.passwordTooLong || "Password is too long"),
  });
}
