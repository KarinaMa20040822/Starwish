// supabase/functions/line-bind/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  try {
    const { code, userId } = await req.json();

    if (!code || !userId) {
      return new Response(JSON.stringify({ error: "Missing code or userId" }), {
        status: 400,
      });
    }

    // 換取 access_token
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: Deno.env.get("LINE_REDIRECT_URI")!,
        client_id: Deno.env.get("LINE_CLIENT_ID")!,
        client_secret: Deno.env.get("LINE_CLIENT_SECRET")!,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: tokenData }), { status: 400 });
    }

    // 取使用者資料
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // 更新 DB
    const dbRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/users?USER_ID=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ LINE_ACCT: profile.userId }),
      }
    );

    if (!dbRes.ok) {
      const error = await dbRes.json();
      throw new Error(JSON.stringify(error));
    }

    return new Response(JSON.stringify({ success: true, profile }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
