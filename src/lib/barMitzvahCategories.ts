import { BarMitzvahCategory } from "@prisma/client";

export const BM_CATEGORY_LABELS_HE: Record<BarMitzvahCategory, string> = {
  HALL:           "אולם",
  CATERING:       "אוכל / קייטרינג",
  PHOTOGRAPHY:    "צילום",
  MUSIC:          "מוזיקה / DJ",
  INVITATIONS:    "הזמנות",
  CLOTHING:       "ביגוד",
  GIFTS:          "מתנות",
  FLOWERS:        "פרחים",
  DECORATIONS:    "קישוטים",
  TRANSPORTATION: "הסעות",
  RABBI:          "רב / בית כנסת",
  OTHER:          "אחר",
};

export const BM_CATEGORY_ORDER: BarMitzvahCategory[] = [
  BarMitzvahCategory.HALL,
  BarMitzvahCategory.CATERING,
  BarMitzvahCategory.PHOTOGRAPHY,
  BarMitzvahCategory.MUSIC,
  BarMitzvahCategory.INVITATIONS,
  BarMitzvahCategory.CLOTHING,
  BarMitzvahCategory.GIFTS,
  BarMitzvahCategory.FLOWERS,
  BarMitzvahCategory.DECORATIONS,
  BarMitzvahCategory.TRANSPORTATION,
  BarMitzvahCategory.RABBI,
  BarMitzvahCategory.OTHER,
];

// Tasteful palette — kept consistent across charts and badges.
export const BM_CATEGORY_COLORS: Record<BarMitzvahCategory, string> = {
  HALL:           "#6366f1", // indigo
  CATERING:       "#f59e0b", // amber
  PHOTOGRAPHY:    "#0ea5e9", // sky
  MUSIC:          "#8b5cf6", // violet
  INVITATIONS:    "#ec4899", // pink
  CLOTHING:       "#14b8a6", // teal
  GIFTS:          "#10b981", // emerald
  FLOWERS:        "#f43f5e", // rose
  DECORATIONS:    "#a855f7", // purple
  TRANSPORTATION: "#3b82f6", // blue
  RABBI:          "#d97706", // dark amber
  OTHER:          "#64748b", // slate
};

export function bmCategoryLabel(
  cat: BarMitzvahCategory,
  custom?: string | null,
): string {
  if (cat === BarMitzvahCategory.OTHER && custom && custom.trim()) {
    return custom.trim();
  }
  return BM_CATEGORY_LABELS_HE[cat];
}
