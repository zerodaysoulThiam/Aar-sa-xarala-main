import { useState, useEffect } from "react";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashMasterPassword } from "@/lib/crypto";
import { getMasterHash, setMasterHash, getLockoutInfo, setLockoutInfo, resetLockout } from "@/lib/vaultManager";
import logo from "@/assets/logo.png";

interface Props {
  onUnlock: (masterPassword: string) => void;
}

export default function MasterPasswordScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(!getMasterHash());
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    const lockout = getLockoutInfo();
    if (lockout.lockedUntil && lockout.lockedUntil > Date.now()) {
      const remaining = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
      setLockoutSeconds(remaining);
    }
  }, []);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) { resetLockout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (lockoutSeconds > 0) return;

    if (isCreating) {
      if (password.length < 8) {
        setError("Le mot de passe maître doit contenir au moins 8 caractères");
        return;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      const hash = await hashMasterPassword(password);
      setMasterHash(hash);
      onUnlock(password);
    } else {
      const hash = await hashMasterPassword(password);
      const stored = getMasterHash();
      if (hash === stored) {
        resetLockout();
        onUnlock(password);
      } else {
        const lockout = getLockoutInfo();
        const newAttempts = lockout.attempts + 1;
        if (newAttempts >= 3) {
          const lockedUntil = Date.now() + 30000;
          setLockoutInfo(0, lockedUntil);
          setLockoutSeconds(30);
          setError("Trop de tentatives. Verrouillé pendant 30 secondes.");
        } else {
          setLockoutInfo(newAttempts, null);
          setError(`Mot de passe incorrect (${3 - newAttempts} tentative(s) restante(s))`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="SecureVault" className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-bold font-mono text-primary text-glow">
            SecureVault
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Password Manager
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 glow-cyan">
          <div className="flex items-center gap-2 mb-6">
            {isCreating ? (
              <ShieldCheck className="w-5 h-5 text-primary" />
            ) : (
              <Lock className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold">
              {isCreating ? "Créer le mot de passe maître" : "Déverrouiller le coffre"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Mot de passe maître</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-muted border-border font-mono"
                disabled={lockoutSeconds > 0}
                autoFocus
              />
            </div>

            {isCreating && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Confirmer</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted border-border font-mono"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {lockoutSeconds > 0 && (
              <div className="text-center text-warning text-sm font-mono">
                Verrouillé : {lockoutSeconds}s
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={lockoutSeconds > 0}
            >
              {isCreating ? "Créer et accéder" : "Déverrouiller"}
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-4">
          Chiffrement AES-256 · Stockage local sécurisé
        </p>
      </div>
    </div>
  );
}
