import { z } from "zod";

export function buildLandInfoSchema(t) {
  return z
    .object({
      landName: z.string().trim().min(1, t.errorLandName),
      maxLeaves: z.string(),
      minLeaves: z.string(),
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
