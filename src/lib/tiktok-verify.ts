export function generateVerificationCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  return `LIVE-${digits}-VERIFY`;
}
