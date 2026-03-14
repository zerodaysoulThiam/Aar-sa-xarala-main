// Web Crypto API based encryption module

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
}

async function deriveKey(keyMaterial: CryptoKey, salt: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPassword(plaintext: string, masterPassword: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await getKeyMaterial(masterPassword);
  const key = await deriveKey(keyMaterial, salt.buffer as ArrayBuffer);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptPassword(ciphertext: string, masterPassword: string): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);
  
  const keyMaterial = await getKeyMaterial(masterPassword);
  const key = await deriveKey(keyMaterial, salt.buffer as ArrayBuffer);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  
  return new TextDecoder().decode(decrypted);
}

export async function hashMasterPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
