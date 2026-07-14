import { z } from "zod";

export function buildCashRequestSchema(t, advanceLimit, formatCurrency) {
  return z.object({
    amount: z
      .string()
      .min(1, t.pleaseEnterAmount)
      .superRefine((val, ctx) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.pleaseEnterValidAmount });
          return;
        }
        if (advanceLimit !== null && num > advanceLimit) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${t.amountExceedsLimit} Rs. ${formatCurrency(advanceLimit)}` });
        }
      }),
  });
}
