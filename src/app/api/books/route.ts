import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const authorIdParam = searchParams.get("authorId");

    let whereClause: any = {};

    if (user.role === Role.AUTHOR) {
      whereClause.authorId = user.id;
    } else if (user.role === Role.ADMIN && authorIdParam) {
      whereClause.authorId = authorIdParam;
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, email: true, authorCode: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Fetch books error:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
