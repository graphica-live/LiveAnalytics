-- 注意: 本番デプロイは `prisma db push --accept-data-loss` を使用しており、このファイルは
-- 実行されない(db pushはmigrationsフォルダを読まない)。本番への実際の反映は
-- `scripts/backfill-verified.ts`(Dockerfile CMDから起動時に実行)が担当する。
-- このファイルはローカルで `prisma migrate deploy` を使う場合のためにのみ存在する。
--
-- BIO認証を廃止したため、既存の未認証Streamerも認証済み扱いに揃える。
-- 以降はTikTok ID登録時点でverified=trueになる(src/app/api/streamer/tiktok-id)。
UPDATE "Streamer"
SET "verified" = true,
    "verifiedAt" = COALESCE("verifiedAt", NOW())
WHERE "verified" = false;

ALTER TABLE "Streamer" ALTER COLUMN "verified" SET DEFAULT true;
