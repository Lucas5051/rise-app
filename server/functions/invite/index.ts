// Fonction serveur « invite » : aperçu et utilisation d'un code d'invitation.
// - Le code n'est jamais stocké en clair (empreinte SHA-256 en base).
// - 5 échecs / 15 min par empreinte réseau, même message pour tout code refusé.
// - La clé d'administration (service role) n'existe QUE dans l'environnement de cette fonction.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const INVALID = { ok: false, error: "invalid", message: "Code invalide ou expiré. Vérifie-le auprès de ton coach." };
const LOCKED = { ok: false, error: "locked", message: "Trop d'essais. Réessaie dans 15 minutes." };

async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "inconnu";
  const ipHash = (await sha(ip + "|" + key.slice(-16))).slice(0, 32); // l'adresse IP n'est jamais conservée
  let body: any = {};
  try { body = await req.json(); } catch { return json(INVALID, 400); }
  const code = String(body.code || "").slice(0, 32);

  if (body.action === "preview") {
    const { data, error } = await admin.rpc("invite_preview", { p_code: code, p_ip: ipHash });
    if (error) return json({ ok: false, error: "server" }, 500);
    if (!data.ok) return json(data.error === "locked" ? LOCKED : INVALID, data.error === "locked" ? 429 : 400);
    const d = data.draft || {};
    // Seules les informations préparées pour CET athlète sont renvoyées
    return json({ ok: true, email: data.email, first: d.first || "", last: d.last || "", sport: d.sport || "", goal: d.goal || "",
      program: data.program, startDate: data.startDate, startWeek: data.startWeek, formula: data.formula, coach: data.coach, expiresAt: data.expiresAt });
  }

  if (body.action === "redeem") {
    const pre = await admin.rpc("invite_preview", { p_code: code, p_ip: ipHash });
    if (pre.error) return json({ ok: false, error: "server" }, 500);
    if (!pre.data.ok) return json(pre.data.error === "locked" ? LOCKED : INVALID, pre.data.error === "locked" ? 429 : 400);
    const email = String(pre.data.email || body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "email", message: "Adresse e-mail invalide." }, 400);
    if (password.length < 10) return json({ ok: false, error: "password", message: "Mot de passe : 10 caractères minimum." }, 400);
    const patch = body.patch && typeof body.patch === "object" ? body.patch : {};
    // Compte créé par le serveur : l'adresse est considérée comme validée par le code personnel remis par le coach
    const cu = await admin.auth.admin.createUser({ email, password, email_confirm: true,
      user_metadata: { first_name: patch.first || pre.data.draft?.first || "", last_name: patch.last || pre.data.draft?.last || "" } });
    if (cu.error) {
      const exists = /already|registered|exists/i.test(cu.error.message);
      return json({ ok: false, error: exists ? "exists" : "auth",
        message: exists ? "Un compte existe déjà avec cette adresse. Connecte-toi, puis demande à ton coach un nouveau code." : "Création du compte impossible." }, 400);
    }
    const uid = cu.data.user!.id;
    const r = await admin.rpc("invite_redeem", { p_code: code, p_ip: ipHash, p_user: uid, p_patch: patch });
    if (r.error || !r.data?.ok) {
      await admin.auth.admin.deleteUser(uid); // aucune trace d'un compte à moitié créé
      return json(r.data?.error === "locked" ? LOCKED : INVALID, 400);
    }
    if (body.consent) await admin.from("consents").insert([
      { user_id: uid, kind: "cgu", version: String(body.consent.version || "1"), granted: true },
      ...(body.consent.health ? [{ user_id: uid, kind: "donnees_sante", version: String(body.consent.version || "1"), granted: true }] : []),
    ]);
    return json({ ok: true, email });
  }
  return json({ ok: false, error: "action" }, 400);
});
