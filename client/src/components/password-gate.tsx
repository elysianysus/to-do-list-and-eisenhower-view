import { useState } from "react";
import { Lock } from "lucide-react";

const SESSION_KEY = "app_unlocked";

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setUnlocked(true);
      } else {
        setError(true);
        setInput("");
        setTimeout(() => setError(false), 2000);
      }
    } catch {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xs px-8 py-10 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-medium text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            disabled={loading}
            className={`w-full px-3 py-2 text-sm border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors ${
              error ? "border-red-400 bg-red-50" : "border-input"
            }`}
            data-testid="input-password"
          />
          {error && (
            <p className="text-xs text-red-500 mt-1.5" data-testid="text-password-error">
              Incorrect password
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-2 text-sm text-primary border border-primary rounded bg-transparent hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
            data-testid="button-unlock"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
