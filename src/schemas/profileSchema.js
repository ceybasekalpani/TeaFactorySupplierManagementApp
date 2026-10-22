import { z } from "zod";

export function buildProfileSchema(t) {
  return z.object({
    name: z.string().trim().min(2, t.fillNameAddressPhone).max(100, t.nameTooLong || "Name is too long"),
    address: z.string().trim().min(1, t.fillNameAddressPhone).max(250, t.addressTooLong || "Address is too long"),
    phone: z.string().trim().regex(/^\d{10}$/, t.invalidPhone || "Phone number must contain exactly 10 digits"),
    phone2: z.string().trim().refine((value) => !value || /^\d{10}$/.test(value), t.invalidPhone || "Phone number must contain exactly 10 digits"),
    phone3: z.string().trim().refine((value) => !value || /^\d{10}$/.test(value), t.invalidPhone || "Phone number must contain exactly 10 digits"),
  });
}

export function buildChangePasswordSchema(t) {
  return z
    .object({
      currentPassword: z.string().min(1, t.fillAllFields || "Please fill all password fields").max(128, t.passwordTooLong || "Password is too long"),
      newPassword: z.string().min(8, t.passwordMinLength || "New password must be at least 8 characters"),
      confirmPassword: z.string().min(1, t.fillAllFields || "Please fill all password fields").max(128, t.passwordTooLong || "Password is too long"),
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
