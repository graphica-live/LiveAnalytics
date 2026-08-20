"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = "input" | "saved";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [tiktokId, setTiktokId] = useState("");
  const [savedTiktokId, setSavedTiktokId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [issuedApiKey, setIssuedApiKey] = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  useEffect(() => {
    fetch("/api/streamer/api-key")
      .then((r) => r.json())
      .then((data) => setHasApiKey(Boolean(data.hasApiKey)))
      .catch(() => {});
  }, []);

  async function handleIssueApiKey() {
    setApiKeyLoading(true);
    const res = await fetch("/api/streamer/api-key", { method: "POST" });
    const data = await res.json();
    setApiKeyLoading(false);

    if (!res.ok) {
      setError(data.error || "APIキーの発行に失敗しました");
      return;
    }

    setIssuedApiKey(data.apiKey);
    setHasApiKey(true);
  }

  useEffect(() => {
    // 登録済みならフォームを飛ばして現在のIDを表示する
    fetch("/api/streamer/tiktok-id")
      .then((r) => r.json())
      .then((data) => {
        if (data.tiktokId) {
          setSavedTiktokId(data.tiktokId);
          setStep("saved");
        }
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const clean = tiktokId.replace(/^@/, "").trim();
    if (!clean) {
      setError("TikTok IDを入力してください");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/streamer/tiktok-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiktokId: clean }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "エラーが発生しました");
      return;
    }

    setSavedTiktokId(clean);
    setStep("saved");
    setTimeout(() => router.push("/analytics"), 1200);
  }

  function handleEdit() {
    setStep("input");
    setTiktokId(savedTiktokId);
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand">TikTok IDの設定</h1>
        </div>

        <div className="card space-y-4">
          {step === "saved" && (
            <div className="space-y-4">
              <div className="text-center py-2 space-y-1">
                <div className="text-3xl">✓</div>
                <p className="text-green-400 font-semibold">設定が完了しました</p>
                <p className="text-sm text-gray-400">
                  対象のTikTok ID: <span className="font-mono text-brand">@{savedTiktokId}</span>
                </p>
              </div>

              <a
                href={`https://www.tiktok.com/@${savedTiktokId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-brand transition-colors"
              >
                プロフィールを開く
                <ExternalLinkIcon />
              </a>

              <div className="flex gap-2">
                <button onClick={handleEdit} className="btn-ghost flex-1 text-sm">
                  IDを変更する
                </button>
                <button
                  onClick={() => router.push("/analytics")}
                  className="btn-primary flex-1 text-sm"
                >
                  ダッシュボードへ
                </button>
              </div>
            </div>
          )}

          {step === "input" && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 block mb-1">
                  TikTok ユーザーID
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-surface border border-border rounded-lg text-gray-400 text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="your_tiktok_id"
                    value={tiktokId}
                    onChange={(e) => setTiktokId(e.target.value)}
                    className="input-field"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  IDを設定するとライブへの接続が始まり、オーバーレイと解析データを利用できます。
                </p>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-2">
                {savedTiktokId && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("saved");
                      setError("");
                    }}
                    className="btn-ghost flex-1 text-sm"
                  >
                    キャンセル
                  </button>
                )}
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "保存中..." : "設定する"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card space-y-3 mt-4">
          <div>
            <p className="text-sm text-gray-300 font-semibold">TikEffect連携用APIキー</p>
            <p className="text-xs text-gray-400 mt-1">
              TikEffectの称号ウィジェット設定画面にこのキーを貼り付けると、先月度貢献MVP/TOP5を自動反映できます。
            </p>
          </div>

          {issuedApiKey && (
            <div className="bg-surface border border-brand/30 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">
                このキーは今だけ表示されます。コピーしてTikEffectに保存してください。
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-white break-all bg-black/40 px-3 py-2 rounded flex-1">
                  {issuedApiKey}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(issuedApiKey)}
                  className="btn-ghost text-xs"
                  title="コピー"
                >
                  コピー
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleIssueApiKey}
            disabled={apiKeyLoading}
            className="btn-primary w-full text-sm"
          >
            {apiKeyLoading ? "処理中..." : hasApiKey ? "APIキーを再発行する" : "APIキーを発行する"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-3 h-3"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
