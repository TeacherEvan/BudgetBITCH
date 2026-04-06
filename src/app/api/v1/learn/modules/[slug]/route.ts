import { getLearnModuleBySlug } from "@/modules/learn/module-catalog";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const lesson = getLearnModuleBySlug(slug);

  if (!lesson) {
    return NextResponse.json({ error: "Learn module not found." }, { status: 404 });
  }

  return NextResponse.json(lesson);
}
