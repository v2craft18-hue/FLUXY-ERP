import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const sb = createClient(url, key, { auth: { persistSession: false } })

// Query information_schema via RPC-style raw query using PostgREST is limited,
// so we probe each expected table by selecting 0 rows and reading the columns.
const tables = ["empresas", "usuarios", "clientes", "produtos", "pedidos", "pedido_itens", "cobracas", "rotas"]

for (const t of tables) {
  const { data, error } = await sb.from(t).select("*").limit(1)
  if (error) {
    console.log(`[TABLE ${t}] ERROR: ${error.message}`)
  } else {
    const cols = data && data.length > 0 ? Object.keys(data[0]) : "(empty - no rows to infer columns)"
    console.log(`[TABLE ${t}] OK. columns: ${JSON.stringify(cols)}`)
  }
}

// Also count rows in key tables
for (const t of ["empresas", "usuarios", "clientes"]) {
  const { count, error } = await sb.from(t).select("*", { count: "exact", head: true })
  if (error) {
    console.log(`[COUNT ${t}] ERROR: ${error.message}`)
  } else {
    console.log(`[COUNT ${t}] rows = ${count}`)
  }
}
