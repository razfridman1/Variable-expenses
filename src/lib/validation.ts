import { z } from "zod";
import { BarMitzvahCategory, Category } from "@prisma/client";

const categoryEnum = z.nativeEnum(Category);
const bmCategoryEnum = z.nativeEnum(BarMitzvahCategory);

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

// ─────────────────────────────────────────────────────────────────────────────
// Bar Mitzvah expense validation
// ─────────────────────────────────────────────────────────────────────────────
const bmExpenseBaseSchema = z.object({
  vendor: z.string().trim().min(1).max(120),
  category: bmCategoryEnum,
  customCategory: z.string().trim().max(80).optional().nullable(),
  amountPaid: z.number().min(0).max(10_000_000),
  amountRemaining: z.number().min(0).max(10_000_000),
  paymentDate: z.string().datetime().optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

export const bmExpenseCreateSchema = bmExpenseBaseSchema.superRefine((val, ctx) => {
  if (val.category === BarMitzvahCategory.OTHER) {
    if (!val.customCategory || val.customCategory.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customCategory"],
        message: 'בקטגוריית "אחר" יש להזין שם מותאם',
      });
    }
  }
});

export type BmExpenseCreateInput = z.infer<typeof bmExpenseCreateSchema>;

// PATCH — every field optional; OTHER-requires-customCategory is enforced
// inside the route handler against the merged state.
export const bmExpenseUpdateSchema = bmExpenseBaseSchema.partial();
