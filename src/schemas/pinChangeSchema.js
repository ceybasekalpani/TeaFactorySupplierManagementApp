import { z } from "zod";

export function buildPinChangeSchema(t) {
  return z
    .object({
      currentPin: z.string().min(1, t.pinFillAllFields),
      newPin: z.string().min(1, t.pinFillAllFields),
      confirmPin: z.string().min(1, t.pinFillAllFields),
    })
    .superRefine((data, ctx) => {
      if (data.newPin.length < 4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.pinMustBe4Digits, path: ["newPin"] });
        return;
      }
      if (data.newPin !== data.confirmPin) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.newPinConfirmMismatch, path: ["confirmPin"] });
      }
    });
}
