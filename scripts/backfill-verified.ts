// BIO認証廃止(2026-08-20)に伴い、既存の未認証Streamerを認証済みへ揃える移行スクリプト。
//
// 本番デプロイは `prisma db push` を使っており prisma/migrations は実行されないため、
// データ移行はこのスクリプトをコンテナ起動時に走らせて行う(Dockerfile CMD)。
// 冪等: verified=false の行がなければ何も更新しないので、毎回実行して安全。
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.streamer.updateMany({
    where: { verified: false },
    data: { verified: true, verifiedAt: new Date() },
  });

  if (result.count === 0) {
    console.log("[backfill-verified] 未認証のStreamerはありません。スキップします。");
    return;
  }

  console.log(`[backfill-verified] ${result.count}件のStreamerを認証済みに更新しました。`);
}

main()
  .catch((err) => {
    console.error("[backfill-verified] 失敗:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
