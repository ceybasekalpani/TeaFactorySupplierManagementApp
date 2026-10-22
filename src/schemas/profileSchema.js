import { z } from "zod";

export function buildProfileSchema(t) {
  return z.object({
    name: z.string().trim().min(2, t.fillNameAddressPhone),
    address: z.string().trim().min(1, t.fillNameAddressPhone),
    phone: z.string().trim().regex(/^\d{10}$/, t.invalidPhone || "Phone number must contain exactly 10 digits"),
    phone2: z.string().trim().refine((value) => !value || /^\d{10}$/.test(value), t.invalidPhone || "Phone number must contain exactly 10 digits"),
    phone3: z.string().trim().refine((value) => !value || /^\d{10}$/.test(value), t.invalidPhone || "Phone number must contain exactly 10 digits"),
  });
}

export function buildChangePasswordSchema(t) {
  return z
    .object({
      currentPassword: z.string().min(1, t.fillAllFields || "Please fill all password fields"),
      newPassword: z.string().min(8, t.passwordMinLength || "New password must be at least 8 characters"),
      confirmPassword: z.string().min(1, t.fillAllFields || "Please fill all password fields"),
    })
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t.passwordsDoNotMatch || "New passwords do not match",
          path: ["confirmPassword"],
        });
      }
    });
}
