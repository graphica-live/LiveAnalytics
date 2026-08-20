import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode } from "@/lib/tiktok-verify";
import { resolveRoomForStreamer } from "@/lib/tiktok-room";

// GET: return the TikTok ID currently registered for the signed-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streamer = await prisma.streamer.findUnique({
    where: { userId: session.user.id },
    select: { tiktokId: true },
  });

  if (!streamer) return NextResponse.json({});

  return NextResponse.json({ tiktokId: streamer.tiktokId });
}

// POST: register or replace the TikTok ID for the signed-in user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tiktokId } = await req.json();
  const clean = String(tiktokId || "")
    .replace(/^@/, "")
    .trim();

  if (!clean) {
    return NextResponse.json({ error: "TikTok IDを入力してください" }, { status: 400 });
  }

  // 登録は無条件で許可する(他アカウントとの重複登録も可)。
  // BIO認証は廃止したため、登録時点でverified扱いにする(モバイル版と同じ挙動)。
  const streamer = await prisma.streamer.upsert({
    where: { userId: session.user.id },
    update: { tiktokId: clean, verified: true, verifiedAt: new Date() },
    create: {
      userId: session.user.id,
      tiktokId: clean,
      verificationCode: generateVerificationCode(),
      verified: true,
      verifiedAt: new Date(),
    },
  });

  // 同じtiktokIdを共有するTiktokRoomへ即座に紐付ける(Workerのensure loopを待たずに
  // オーバーレイ/ギフトデータ共有を反映するため)。
  await resolveRoomForStreamer(streamer.id);

  return NextResponse.json({ tiktokId: clean });
}
