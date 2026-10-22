import { z } from "zod";

export function buildPinChangeSchema(t) {
  return z
    .object({
      currentPin: z.string().regex(/^\d{4}$/, t.pinMustBe4Digits),
      newPin: z.string().regex(/^\d{4}$/, t.pinMustBe4Digits),
      confirmPin: z.string().regex(/^\d{4}$/, t.pinMustBe4Digits),
    })
    .superRefine((data, ctx) => {
      if (data.newPin !== data.confirmPin) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.newPinConfirmMismatch, path: ["confirmPin"] });
      }
    });
}
