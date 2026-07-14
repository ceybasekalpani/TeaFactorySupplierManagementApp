import { z } from "zod";

export function buildLoginSchema(t) {
  return z.object({
    username: z.string().trim().min(1, t.usernameRequired),
    password: z.string().trim().min(1, t.passwordRequired),
  });
}
