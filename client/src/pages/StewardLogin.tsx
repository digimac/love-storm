import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Zap, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function StewardLogin() {
  const { login } = useAuth();
  const [, navigate] = useLocation(useHashLocation);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    setError("");

    // Auto-advance
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits are filled
    if (digit && index === 3) {
      const fullPin = [...next].join("");
      if (fullPin.length === 4) {
        submit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const fullPin = pin.join("");
      if (fullPin.length === 4) submit(fullPin);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setPin(next);
    if (text.length === 4) {
      submit(text);
    } else {
      inputRefs.current[text.length]?.focus();
    }
  };

  const submit = async (fullPin: string) => {
    setLoading(true);
    setError("");
    const result = await login(fullPin);
    setLoading(false);
    if (result.ok) {
      navigate("/steward");
    } else {
      setError(result.error ?? "Incorrect PIN");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pin.join("");
    if (fullPin.length < 4) {
      setError("Please enter all 4 digits");
      return;
    }
    submit(fullPin);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer">
            <ArrowLeft size={14} />
            Back to home
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield size={26} className="text-primary" />
            </div>
            <h1 className="font-display font-bold text-xl text-foreground">Steward Access</h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Enter your 4-digit PIN to manage<br />storms and review requests.
            </p>
          </div>

          {/* PIN form */}
          <form onSubmit={handleSubmit} noValidate>
            <div
              className={`flex justify-center gap-3 mb-6 transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
              data-testid="pin-input-group"
            >
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  data-testid={`input-pin-${i}`}
                  aria-label={`PIN digit ${i + 1}`}
                  className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-background
                    focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all
                    ${error ? "border-destructive" : digit ? "border-primary" : "border-border"}
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-center text-sm text-destructive mb-4"
                data-testid="text-pin-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || pin.join("").length < 4}
              data-testid="button-steward-login"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Verifying…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap size={15} />
                  Enter Dashboard
                </span>
              )}
            </Button>
          </form>

          {/* Demo hint */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            Demo PIN: <span className="font-mono font-semibold tracking-widest">1234</span>
          </p>
        </div>
      </div>

      {/* Shake keyframe via style tag */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
