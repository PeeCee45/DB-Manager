import { NextRequest, NextResponse } from "next/server";
import { testConnection } from "@/lib/db/external";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      host,
      port,
      username,
      password,
      database_name,
    } = body;

    if (!host || !username) {
      return NextResponse.json(
        {
          success: false,
          message: "Host and username are required",
        },
        { status: 400 }
      );
    }

    const parsedPort = Number(port || 3306);

    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid port",
        },
        { status: 400 }
      );
    }

    const result = await testConnection({
      host: String(host).trim(),
      port: parsedPort,
      username: String(username).trim(),
      password: password ?? "",
      database: database_name
        ? String(database_name).trim()
        : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Test failed unexpectedly",
      },
      { status: 500 }
    );
  }
}