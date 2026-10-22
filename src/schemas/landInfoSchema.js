import { z } from "zod";

export function buildLandInfoSchema(t) {
  return z
    .object({
      landName: z.string().trim().min(1, t.errorLandName),
      acres: z.string().refine((v) => !v || /^\d+$/.test(v), t.invalidLandSize || "Acres must contain numbers only"),
      rood: z.string().refine((v) => !v || /^\d+$/.test(v), t.invalidLandSize || "Rood must contain numbers only"),
      perches: z.string().refine((v) => !v || /^\d+$/.test(v), t.invalidLandSize || "Perches must contain numbers only"),
      maxLeaves: z.string().refine((v) => !v || /^\d+(\.\d+)?$/.test(v), t.invalidLeafCapacity || "Leaf capacity must be a valid number"),
      minLeaves: z.string().refine((v) => !v || /^\d+(\.\d+)?$/.test(v), t.invalidLeafCapacity || "Leaf capacity must be a valid number"),
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
