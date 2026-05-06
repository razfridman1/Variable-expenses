import { Category } from "@prisma/client";

export const CATEGORY_LABELS_HE: Record<Category, string> = {
  SUPERMARKET:     "סופרמרקט",
  GROCERY:         "מרכולית",
  EATING_OUT:      "אוכל בחוץ",
  CLOTHING:        "ביגוד והנעלה",
  VACATIONS:       "חופשות",
  STOCK_MISC:      "חנויות שונות",
  PAYBOX_TRANSFER: "העברה לפייבוקס",
  OTHER:           "אחר",
};

export const CATEGORY_ORDER: Category[] = [
  Category.SUPERMARKET,
  Category.GROCERY,
  Category.EATING_OUT,
  Category.CLOTHING,
  Category.VACATIONS,
  Category.STOCK_MISC,
  Category.PAYBOX_TRANSFER,
  Category.OTHER,
];

// A small tasteful palette — kept consistent across charts and badges.
export const CATEGORY_COLORS: Record<Category, string> = {
  SUPERMARKET:     "#6366f1", // indigo
  GROCERY:         "#10b981", // emerald
  EATING_OUT:      "#f59e0b", // amber
  CLOTHING:        "#ec4899", // pink
  VACATIONS:       "#14b8a6", // teal
  STOCK_MISC:      "#8b5cf6", // violet
  PAYBOX_TRANSFER: "#0ea5e9", // sky
  OTHER:           "#64748b", // slate
};

export function categoryLabel(cat: Category, custom?: string | null): string {
  if (cat === Category.OTHER && custom && custom.trim()) return custom.trim();
  return CATEGORY_LABELS_HE[cat];
}
