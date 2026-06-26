const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const tables = ["empresas", "usuarios", "clientes", "produtos", "pedidos", "pedido_itens", "cobracas", "rotas"]

for (const t of tables) {
  const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const body = await res.text()
  if (!res.ok) {
    console.log(`[${t}] HTTP ${res.status}: ${body.slice(0, 200)}`)
  } else {
    let cols = "(empty)"
    try {
      const arr = JSON.parse(body)
      if (arr.length > 0) cols = Object.keys(arr[0]).join(", ")
    } catch {}
    // count
    const cres = await fetch(`${url}/rest/v1/${t}?select=*`, {
      method: "HEAD",
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
    })
    const range = cres.headers.get("content-range")
    console.log(`[${t}] OK rows=${range} cols=${cols}`)
  }
}
