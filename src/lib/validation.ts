import { z } from "zod";
import { Category } from "@prisma/client";

const categoryEnum = z.nativeEnum(Category);

// Base object schema — kept separate so we can derive a partial schema for
// PATCH requests. (ZodEffects, returned by superRefine, has no .partial().)
const expenseBaseSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  category: categoryEnum,
  customCategory: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  spentAt: z.string().datetime().optional(),
});

export const expenseCreateSchema = expenseBaseSchema.superRefine((val, ctx) => {
  if (val.category === Category.OTHER) {
    if (!val.customCategory || val.customCategory.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customCategory"],
        message: 'בקטגוריית "אחר" יש להזין שם מותאם',
      });
    }
  }
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;

// All fields optional for PATCH. The OTHER-requires-customCategory rule
// is enforced contextually inside the route handler (it has the existing
// row, so it can decide based on the merged state).
export const expenseUpdateSchema = expenseBaseSchema.partial();

export const budgetUpsertSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().positive().max(10_000_000),
});
