import { z } from "zod";

export function buildAccountDetailsSchema(t) {
  return z.object({
    bankName: z.string().trim().min(1, t.fillAllFields),
    accountNumber: z
      .string()
      .trim()
      .regex(/^\d+$/, t.accountNumberDigits || "Account number must contain numbers only")
      .superRefine((val, ctx) => {
        if (val.length < 8 || val.length > 16) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.accountNumberLength });
        }
      }),
    accountHolder: z.string().trim().min(2, t.fillAllFields),
    branch: z.string().trim().min(1, t.fillAllFields),
  });
}
