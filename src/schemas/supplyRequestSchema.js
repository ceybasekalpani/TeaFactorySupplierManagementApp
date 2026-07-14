import { z } from "zod";

export function buildSupplyRequestSchema(t, category) {
  return z.object({
    selectedType: z.string().min(1, category === "fertilizer" ? t.pleaseSelectFertilizerType : t.pleaseSelectItemType),
    quantity: z
      .string()
      .trim()
      .min(1, t.pleaseEnterQuantity)
      .superRefine((val, ctx) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.pleaseEnterValidQuantity });
        }
      }),
  });
}
