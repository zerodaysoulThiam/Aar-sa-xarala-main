import { useState, useEffect } from "react";
import { Plus, Key, LogOut, Search, Globe, User, Eye, EyeOff, Pencil, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { loadVault, addPassword, updatePassword, deletePassword, getDecryptedPassword, type VaultEntry } from "@/lib/vaultManager";
import PasswordGenerator from "./PasswordGenerator";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

interface Props {
  masterPassword: string;
  onLock: () => void;
}

type Tab = "vault" | "generator";

export default function VaultDashboard({ masterPassword, onLock }: Props) {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("vault");
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<VaultEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formSite, setFormSite] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    setEntries(loadVault());
  }, []);

  const filtered = entries.filter(e =>
    e.site.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormSite(""); setFormUsername(""); setFormPassword("");
    setShowGenerator(false);
  };

  const handleAdd = async () => {
    if (!formSite || !formUsername || !formPassword) {
      toast.error("Tous les champs sont requis");
      return;
    }
    await addPassword(formSite, formUsername, formPassword, masterPassword);
    setEntries(loadVault());
    setShowAdd(false);
    resetForm();
    toast.success("Mot de passe ajouté");
  };

  const handleUpdate = async () => {
    if (!editEntry || !formSite || !formUsername || !formPassword) return;
    await updatePassword(editEntry.id, formSite, formUsername, formPassword, masterPassword);
    setEntries(loadVault());
    setEditEntry(null);
    resetForm();
    toast.success("Mot de passe modifié");
  };

  const handleDelete = (id: string) => {
    deletePassword(id);
    setEntries(loadVault());
    setVisiblePasswords(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success("Entrée supprimée");
  };

  const toggleVisibility = async (entry: VaultEntry) => {
    if (visiblePasswords[entry.id]) {
      setVisiblePasswords(prev => { const n = { ...prev }; delete n[entry.id]; return n; });
    } else {
      const decrypted = await getDecryptedPassword(entry.encryptedPassword, masterPassword);
      setVisiblePasswords(prev => ({ ...prev, [entry.id]: decrypted }));
    }
  };

  const copyPassword = async (entry: VaultEntry) => {
    const decrypted = await getDecryptedPassword(entry.encryptedPassword, masterPassword);
    await navigator.clipboard.writeText(decrypted);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copié dans le presse-papier");
  };

  const openEdit = async (entry: VaultEntry) => {
    setFormSite(entry.site);
    setFormUsername(entry.username);
    const decrypted = await getDecryptedPassword(entry.encryptedPassword, masterPassword);
    setFormPassword(decrypted);
    setEditEntry(entry);
  };

  return (
    <div className="min-h-screen bg-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SecureVault" className="w-8 h-8" />
            <span className="font-mono font-bold text-primary text-glow">SecureVault</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={tab === "vault" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab("vault")}
              className={tab === "vault" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
            >
              <Key className="w-4 h-4 mr-1" /> Coffre
            </Button>
            <Button
              variant={tab === "generator" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab("generator")}
              className={tab === "generator" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
            >
              Générateur
            </Button>
            <Button variant="ghost" size="sm" onClick={onLock} className="text-muted-foreground ml-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === "generator" ? (
          <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 glow-cyan animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Générateur de mot de passe</h2>
            <PasswordGenerator />
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Search & Add */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              <Button onClick={() => { resetForm(); setShowAdd(true); }} className="bg-primary text-primary-foreground gap-2">
                <Plus className="w-4 h-4" /> Ajouter
              </Button>
            </div>

            {/* Entries */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{entries.length === 0 ? "Votre coffre est vide" : "Aucun résultat"}</p>
                {entries.length === 0 && (
                  <Button onClick={() => { resetForm(); setShowAdd(true); }} variant="outline" className="mt-4">
                    Ajouter votre premier mot de passe
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(entry => (
                  <div key={entry.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{entry.site}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{entry.username}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisibility(entry)}>
                          {visiblePasswords[entry.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyPassword(entry)}>
                          {copiedId === entry.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {visiblePasswords[entry.id] && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <code className="text-sm font-mono text-primary">{visiblePasswords[entry.id]}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-xs text-muted-foreground mt-6">
              {entries.length} entrée{entries.length !== 1 ? "s" : ""} · Chiffrement AES-256
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editEntry} onOpenChange={v => { if (!v) { setShowAdd(false); setEditEntry(null); resetForm(); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editEntry ? "Modifier" : "Ajouter un mot de passe"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Site</label>
              <Input value={formSite} onChange={e => setFormSite(e.target.value)} placeholder="gmail.com" className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nom d'utilisateur</label>
              <Input value={formUsername} onChange={e => setFormUsername(e.target.value)} placeholder="user@gmail.com" className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Mot de passe</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted border-border font-mono flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => setShowGenerator(!showGenerator)}>
                  Générer
                </Button>
              </div>
            </div>

            {showGenerator && (
              <div className="bg-muted rounded-lg p-4">
                <PasswordGenerator onSelect={pw => { setFormPassword(pw); setShowGenerator(false); }} />
              </div>
            )}

            <Button
              onClick={editEntry ? handleUpdate : handleAdd}
              className="w-full bg-primary text-primary-foreground"
            >
              {editEntry ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
