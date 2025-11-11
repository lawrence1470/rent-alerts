import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone number format (10 digits)
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be 10 digits" },
        { status: 400 }
      );
    }

    // Format phone number for storage
    const formattedPhone = `+1${digits}`;

    // Update user metadata with phone number
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        phoneNumber: formattedPhone,
      },
    });

    return NextResponse.json({
      success: true,
      phoneNumber: formattedPhone,
    });
  } catch (error) {
    console.error("Error saving phone number:", error);
    return NextResponse.json(
      { error: "Failed to save phone number" },
      { status: 500 }
    );
  }
}
