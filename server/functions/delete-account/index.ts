// Fonction serveur « delete-account » : suppression réelle du compte de l'utilisateur connecté.
// 1. identifie l'utilisateur à partir de SON jeton ; 2. anonymise messages de groupe et historique (purge_user) ;
// 3. supprime ses fichiers (user-media/<id>/) ; 4. supprime le compte Auth → toutes ses données partent en cascade.
import { createClient } from "jsr:@supabase/supabase-js@2";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u, error } = await admin.auth.getUser(jwt);
  if (error || !u?.user) return json({ ok: false, error: "auth" }, 401);
  let body: any = {}; try { body = await req.json(); } catch { /* */ }
  if (body.confirm !== "SUPPRIMER") return json({ ok: false, error: "confirm" }, 400);
  const id = u.user.id;
  const p = await admin.rpc("purge_user", { p_user: id });
  if (p.error) return json({ ok: false, error: "server" }, 500);
  if (!p.data.ok) return json({ ok: false, error: p.data.error, message: "Un coach qui suit encore des clients ne peut pas supprimer son compte : termine d'abord les suivis." }, 409);
  // Fichiers personnels
  let removed = 0;
  for (let page = 0; page < 50; page++) {
    const { data: files } = await admin.storage.from("user-media").list(id, { limit: 100 });
    if (!files || !files.length) break;
    await admin.storage.from("user-media").remove(files.map((f) => `${id}/${f.name}`)); removed += files.length;
  }
  const d = await admin.auth.admin.deleteUser(id);
  if (d.error) return json({ ok: false, error: "auth_delete" }, 500);
  return json({ ok: true, filesRemoved: removed, ...p.data });
});
