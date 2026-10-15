import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { persona } = await req.json();

    let targetEmail = "";
    if (persona === "priya") {
      targetEmail = "priya.sharma@email.com";
    } else if (persona === "kavita") {
      targetEmail = "kavita.deshmukh@email.com";
    } else if (persona === "sneha") {
      targetEmail = "sneha.kulkarni@email.com";
    } else if (persona === "rohit") {
      targetEmail = "rohit.kapoor@email.com";
    } else if (persona === "admin") {
      targetEmail = "admin@bookleaf.in";
    } else {
      return NextResponse.json({ error: "Unknown persona" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "Persona user not found in database" }, { status: 404 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        authorCode: user.authorCode
      }
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Switch persona error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
