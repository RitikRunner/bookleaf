import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

// List of allowed non-privileged author test personas
const ALLOWED_DEMO_AUTHORS: Record<string, string> = {
  priya: "priya.sharma@email.com",
  kavita: "kavita.deshmukh@email.com",
  sneha: "sneha.kulkarni@email.com",
  rohit: "rohit.kapoor@email.com"
};

export async function POST(req: Request) {
  try {
    const { persona } = await req.json();

    // 1. Strict Security Guard: Never allow administrative impersonation
    if (persona === "admin") {
      return NextResponse.json(
        {
          error:
            "Security Policy Violation: Administrative access cannot be granted via impersonation endpoints. " +
            "Operations staff must authenticate with valid credentials via /api/auth/login."
        },
        { status: 403 }
      );
    }

    // 2. Validate against explicit author allowlist
    const targetEmail = ALLOWED_DEMO_AUTHORS[persona];
    if (!targetEmail) {
      return NextResponse.json(
        { error: "Invalid persona identifier. Only pre-configured author demo personas are supported." },
        { status: 400 }
      );
    }

    // 3. Retrieve user and verify role is strictly AUTHOR
    const user = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "Persona user not found in database" }, { status: 404 });
    }

    if (user.role !== Role.AUTHOR) {
      return NextResponse.json(
        { error: "Security Restriction: Only unprivileged Author profiles can be switched in demo mode." },
        { status: 403 }
      );
    }

    // 4. Create session token for the verified author
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
