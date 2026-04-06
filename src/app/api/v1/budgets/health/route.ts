import { getBudgetHealth } from "@/modules/budgets/budget-health";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      limit: z.number(),
      spent: z.number(),
    }),
  ),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = schema.parse(body);

  return NextResponse.json(getBudgetHealth(input));
}
