import { useState } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { generatePassword, getPasswordStrength, type GeneratorOptions } from "@/lib/passwordGenerator";

interface Props {
  onSelect?: (password: string) => void;
}

export default function PasswordGenerator({ onSelect }: Props) {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16, uppercase: true, lowercase: true, digits: true, symbols: true,
  });
  const [password, setPassword] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);

  const strength = getPasswordStrength(password);
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-warning", "bg-success", "bg-success", "bg-primary"];

  const regenerate = () => {
    setPassword(generatePassword(options));
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateOption = <K extends keyof GeneratorOptions>(key: K, value: GeneratorOptions[K]) => {
    const newOpts = { ...options, [key]: value };
    setOptions(newOpts);
    setPassword(generatePassword(newOpts));
    setCopied(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg p-4 font-mono text-lg text-center break-all tracking-wider text-foreground">
        {password}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors ${i < strength.score ? strengthColors[strength.score] : "bg-border"}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{strength.label}</span>
      </div>

      <div className="flex gap-2">
        <Button onClick={regenerate} variant="outline" className="flex-1 gap-2">
          <RefreshCw className="w-4 h-4" /> Régénérer
        </Button>
        <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copié" : "Copier"}
        </Button>
        {onSelect && (
          <Button onClick={() => onSelect(password)} className="flex-1 bg-primary text-primary-foreground">
            Utiliser
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Longueur</span>
            <span className="font-mono text-primary">{options.length}</span>
          </div>
          <Slider
            value={[options.length]}
            onValueChange={([v]) => updateOption("length", v)}
            min={6}
            max={64}
            step={1}
          />
        </div>

        {([
          ["uppercase", "Majuscules (A-Z)"],
          ["lowercase", "Minuscules (a-z)"],
          ["digits", "Chiffres (0-9)"],
          ["symbols", "Symboles (!@#$)"],
        ] as const).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Switch
              checked={options[key]}
              onCheckedChange={v => updateOption(key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
