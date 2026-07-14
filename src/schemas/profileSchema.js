import { z } from "zod";

export function buildProfileSchema(t) {
  return z.object({
    name: z.string().trim().min(1, t.fillNameAddressPhone),
    address: z.string().trim().min(1, t.fillNameAddressPhone),
    phone: z.string().trim().min(1, t.fillNameAddressPhone),
  });
}

export function buildChangePasswordSchema(t) {
  return z
    .object({
      currentPassword: z.string().min(1, t.fillAllFields || "Please fill all password fields"),
      newPassword: z.string().min(1, t.fillAllFields || "Please fill all password fields"),
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
