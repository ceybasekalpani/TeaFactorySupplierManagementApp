import { z } from "zod";

export function buildLandInfoSchema(t) {
  return z
    .object({
      landName: z.string().trim().min(1, t.errorLandName),
      acres: z.string().refine((v) => !v || /^\d+$/.test(v), t.invalidLandSize || "Acres must contain numbers only"),
      rood: z.string().refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 19), t.invalidLandSize || "Rood must be between 0 and 19"),
      perches: z.string().refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 39), t.invalidLandSize || "Perches must be between 0 and 39"),
      maxLeaves: z.string().refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) > 0), t.invalidLeafCapacity || "Leaf capacity must be a valid number"),
      minLeaves: z.string().refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) > 0), t.invalidLeafCapacity || "Leaf capacity must be a valid number"),
    })
    .superRefine((data, ctx) => {
      if (data.maxLeaves && data.minLeaves) {
        const maxNum = parseFloat(data.maxLeaves);
        const minNum = parseFloat(data.minLeaves);
        if (!isNaN(maxNum) && !isNaN(minNum) && minNum > maxNum) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.errorMinMax, path: ["minLeaves"] });
        }
      }
    });
}
