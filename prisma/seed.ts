/**
 * Seed script — generates realistic sample data for a demo user.
 *
 * Usage:
 *   1. Create a user in Supabase Auth (Dashboard → Authentication → Add user).
 *      Recommended: demo@example.com / demo1234
 *   2. Copy that user's UUID.
 *   3. Run: SEED_USER_ID=<uuid> SEED_USER_EMAIL=demo@example.com npm run prisma:seed
 *
 * Safe to re-run — wipes existing data for that user first.
 */
import { PrismaClient, Category } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_USER_ID = process.env.SEED_USER_ID;
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL ?? "demo@example.com";

const CATEGORIES: Category[] = [
  Category.SUPERMARKET,
  Category.GROCERY,
  Category.EATING_OUT,
  Category.CLOTHING,
  Category.VACATIONS,
  Category.STOCK_MISC,
  Category.OTHER,
];

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  if (!SEED_USER_ID) {
    console.error(
      "\n❌  SEED_USER_ID env var is required. Create a user in Supabase Auth first, then re-run with their UUID.\n",
    );
    process.exit(1);
  }

  console.log(`Seeding data for user ${SEED_USER_ID} (${SEED_USER_EMAIL})…`);

  // upsert user
  await prisma.user.upsert({
    where: { id: SEED_USER_ID },
    create: { id: SEED_USER_ID, email: SEED_USER_EMAIL },
    update: { email: SEED_USER_EMAIL },
  });

  // wipe old data
  await prisma.expense.deleteMany({ where: { userId: SEED_USER_ID } });
  await prisma.monthlyBudget.deleteMany({ where: { userId: SEED_USER_ID } });

  // 12 months of monthly budgets
  const now = new Date();
  const budgets = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    budgets.push({
      userId: SEED_USER_ID,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      amount: 4000,
    });
  }
  await prisma.monthlyBudget.createMany({ data: budgets });

  // ~12 months of expenses (3-7 per week)
  const expenses: Array<{
    userId: string;
    amount: number;
    category: Category;
    customCategory: string | null;
    note: string | null;
    spentAt: Date;
  }> = [];

  const start = new Date(now);
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);

  for (
    let d = new Date(start);
    d <= now;
    d.setDate(d.getDate() + 1)
  ) {
    const perDay = Math.floor(Math.random() * 3); // 0..2
    for (let k = 0; k < perDay; k++) {
      const cat = pick(CATEGORIES);
      const at = new Date(d);
      at.setHours(8 + Math.floor(Math.random() * 12));
      at.setMinutes(Math.floor(Math.random() * 60));
      expenses.push({
        userId: SEED_USER_ID,
        amount: randomBetween(15, 320),
        category: cat,
        customCategory: cat === Category.OTHER ? pick(["חניה", "מתנה", "תרופות"]) : null,
        note: Math.random() < 0.3 ? pick(["מהיום-יום", "סופ״ש", "ארוחה משפחתית", null]) : null,
        spentAt: at,
      });
    }
  }

  await prisma.expense.createMany({ data: expenses });

  // preferences
  await prisma.userPreferences.upsert({
    where: { userId: SEED_USER_ID },
    create: { userId: SEED_USER_ID, lastUsedCategory: Category.SUPERMARKET },
    update: { lastUsedCategory: Category.SUPERMARKET },
  });

  console.log(`✅  Seeded ${expenses.length} expenses across ${budgets.length} months.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
