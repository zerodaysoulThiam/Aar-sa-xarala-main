import { encryptPassword, decryptPassword } from "./crypto";

export interface VaultEntry {
  id: string;
  site: string;
  username: string;
  encryptedPassword: string;
  createdAt: string;
  updatedAt: string;
}

const VAULT_KEY = "securevault_data";
const AUTH_KEY = "securevault_auth";
const LOCKOUT_KEY = "securevault_lockout";

export function getMasterHash(): string | null {
  return localStorage.getItem(AUTH_KEY);
}

export function setMasterHash(hash: string): void {
  localStorage.setItem(AUTH_KEY, hash);
}

export function getLockoutInfo(): { attempts: number; lockedUntil: number | null } {
  const data = localStorage.getItem(LOCKOUT_KEY);
  if (!data) return { attempts: 0, lockedUntil: null };
  return JSON.parse(data);
}

export function setLockoutInfo(attempts: number, lockedUntil: number | null): void {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts, lockedUntil }));
}

export function resetLockout(): void {
  localStorage.removeItem(LOCKOUT_KEY);
}

export function loadVault(): VaultEntry[] {
  const data = localStorage.getItem(VAULT_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

function saveVault(entries: VaultEntry[]): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(entries));
}

export async function addPassword(site: string, username: string, password: string, masterPassword: string): Promise<VaultEntry> {
  const entries = loadVault();
  const encrypted = await encryptPassword(password, masterPassword);
  const entry: VaultEntry = {
    id: crypto.randomUUID(),
    site,
    username,
    encryptedPassword: encrypted,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.push(entry);
  saveVault(entries);
  return entry;
}

export async function updatePassword(id: string, site: string, username: string, password: string, masterPassword: string): Promise<void> {
  const entries = loadVault();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  entries[idx].site = site;
  entries[idx].username = username;
  entries[idx].encryptedPassword = await encryptPassword(password, masterPassword);
  entries[idx].updatedAt = new Date().toISOString();
  saveVault(entries);
}

export function deletePassword(id: string): void {
  const entries = loadVault().filter(e => e.id !== id);
  saveVault(entries);
}

export async function getDecryptedPassword(encryptedPassword: string, masterPassword: string): Promise<string> {
  return decryptPassword(encryptedPassword, masterPassword);
}
