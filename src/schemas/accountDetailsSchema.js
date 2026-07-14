import { z } from "zod";

export function buildAccountDetailsSchema(t) {
  return z.object({
    bankName: z.string().min(1, t.fillAllFields),
    accountNumber: z
      .string()
      .min(1, t.fillAllFields)
      .superRefine((val, ctx) => {
        if (val.length < 8 || val.length > 16) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.accountNumberLength });
        }
      }),
    accountHolder: z.string().min(1, t.fillAllFields),
    branch: z.string().min(1, t.fillAllFields),
  });
}
