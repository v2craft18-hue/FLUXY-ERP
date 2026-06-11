# AUDITORIA DE POLÍTICAS RLS - Supabase

**Data da Auditoria:** 6 de janeiro de 2026
**Projeto Supabase:** eyyttblikwpdislznuia
**Scope:** Tabelas public (empresas, usuarios, usuarios_auth_map, clientes, produtos, pedidos, cobracas, rotas)

---

## RESUMO EXECUTIVO

Realizou-se auditoria completa das políticas de Row Level Security (RLS) no banco de dados Supabase do projeto FLUXY-ERP. A auditoria foi limitada pelos mecanismos de acesso disponível - a API REST do Supabase não expõe diretamente a tabela de sistema `pg_policies`, e ferramentas como `psql` não estão disponíveis no ambiente.

---

## METODOLOGIA

1. Tentativa via REST API do Supabase (rpc/pg_policies)
2. Tentativa via psql command-line (não disponível)
3. Tentativa via SQL direto (não disponível)
4. Inspeção manual via curl com SUPABASE_SERVICE_ROLE_KEY

**Resultado:** O acesso programático às políticas RLS é limitado devido às restrições do ambiente.

---

## ACHADOS

### Verificação de Existência das Tabelas

✅ **CONFIRMADO:** Todas as 8 tabelas existem e são acessíveis via Supabase JS Client:
- empresas: ✓ Acessível
- usuarios: ✓ Acessível
- usuarios_auth_map: ✓ Acessível
- clientes: ✓ Acessível
- produtos: ✓ Acessível
- pedidos: ✓ Acessível
- cobracas: ✓ Acessível
- rotas: ✓ Acessível

### Status Geral das Tabelas

| Tabela | Existe | Acessível | RLS Habilitado | Policies | Status |
|--------|---|---|---|---|---|
| empresas | ✓ | ✓ | ❓ | 0 via API | ⚠️ |
| usuarios | ✓ | ✓ | ❓ | 0 via API | ⚠️ |
| usuarios_auth_map | ✓ | ✓ | ❓ | 0 via API | ⚠️ |
| clientes | ✓ | ✓ | ❓ | 0 via API | ⚠️ |
| produtos | ✓ | ✓ | ❓ | 0 via API | ⚠️ |
| pedidos | ✓ | ✓ | ❓ | 0 via API | ⚠️ |
| cobracas | ✓ | ✓ | ❓ | 0 via API | ⚠️ |
| rotas | ✓ | ✓ | ❓ | 0 via API | ⚠️ |

**Nota:** ✓ = Confirmado | ❓ = Indeterminado | 0 = Nenhuma detectada via API REST

---

## DETALHES POR TABELA

### 1. TABELA: empresas
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

### 2. TABELA: usuarios
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

### 3. TABELA: usuarios_auth_map
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

### 4. TABELA: clientes
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

### 5. TABELA: produtos
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

### 6. TABELA: pedidos
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

### 7. TABELA: cobracas
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

### 8. TABELA: rotas
- **RLS Status:** ❓ Indeterminado via API
- **Policies Detectadas:** 0
- **Comando:** N/A
- **WHERE:** N/A
- **WITH CHECK:** N/A
- **Status:** ⚠️ Sem policies configuradas ou não acessível via API

---

## RECOMENDAÇÕES

### ⚠️ CRÍTICO - Para verificação completa:

1. **Acessar console do Supabase diretamente:**
   - Ir para https://app.supabase.com
   - Selecionar projeto FLUXY-ERP
   - Abrir SQL Editor
   - Executar queries de diagnóstico de RLS

2. **Query SQL para diagnóstico completo (executar no Supabase SQL Editor):**
```sql
-- Ver RLS status de todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('empresas', 'usuarios', 'usuarios_auth_map', 'clientes', 'produtos', 'pedidos', 'cobracas', 'rotas')
ORDER BY tablename;

-- Ver todas as policies
SELECT tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('empresas', 'usuarios', 'usuarios_auth_map', 'clientes', 'produtos', 'pedidos', 'cobracas', 'rotas')
ORDER BY tablename, policyname;
```

3. **Verificar na UI Supabase:**
   - Authentication → Policies
   - Ou em cada tabela → RLS tab

---

## CONCLUSÕES PRELIMINARES

Com base na auditoria realizada:

1. ✓ **Todas as 8 tabelas solicitadas existem e são acessíveis**
2. ⚠️ **Não foi possível confirmar o status RLS das tabelas via API**
3. ⚠️ **A API REST não retornou policies para nenhuma tabela**

**Possíveis Cenários:**
- A RLS pode estar HABILITADA mas sem policies (permissão padrão)
- A RLS pode estar DESABILITADA (sem proteção)
- As policies podem estar configuradas mas não são visíveis via API REST

---

## PRÓXIMOS PASSOS - AÇÕES REQUERIDAS

### Verificação Urgente (via Supabase Console)

1. **Acesse o Supabase Console:**
   - URL: https://app.supabase.com
   - Projeto: FLUXY-ERP (eyyttblikwpdislznuia)

2. **Para cada tabela, verifique:**
   - SQL Editor → Execute as queries abaixo
   - Ou: Acesse a tabela → Aba "RLS" na UI

3. **Queries de Diagnóstico:**

```sql
-- Verificar RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('empresas', 'usuarios', 'usuarios_auth_map', 'clientes', 'produtos', 'pedidos', 'cobracas', 'rotas')
ORDER BY tablename;

-- Ver todas as policies
SELECT tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('empresas', 'usuarios', 'usuarios_auth_map', 'clientes', 'produtos', 'pedidos', 'cobracas', 'rotas')
ORDER BY tablename, policyname;

-- Contar policies por tabela
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('empresas', 'usuarios', 'usuarios_auth_map', 'clientes', 'produtos', 'pedidos', 'cobracas', 'rotas')
GROUP BY tablename
ORDER BY tablename;
```

4. **Se RLS não estiver habilitado, ativar:**
```sql
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_auth_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobracas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
```

---

## RECOMENDAÇÕES DE SEGURANÇA

### Se não há policies configuradas:

⚠️ **CRÍTICO** - Sem policies, qualquer usuário com credenciais pode:
- Ver todos os dados de todas as tabelas
- Modificar todos os dados
- Deletar todos os dados

### Recomendado implementar:

```sql
-- Exemplo: Permitir usuários ver apenas sua própria empresa
CREATE POLICY "Users can view own company data"
  ON empresas FOR SELECT
  USING (id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Exemplo: Apenas admins podem deletar
CREATE POLICY "Admins can delete"
  ON empresas FOR DELETE
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'));
```

---

## GLOSSÁRIO

- **RLS:** Row Level Security - Controle de acesso em nível de linha no PostgreSQL
- **Policy:** Regra de acesso que define quem pode fazer o quê em qual dado
- **PERMISSIVE:** Policy que PERMITE acesso (padrão)
- **RESTRICTIVE:** Policy que BLOQUEIA acesso
- **Roles:** Papéis/usuários aos quais a policy se aplica

---

1. ✗ API REST não expõe tabelas de sistema PostgreSQL (pg_policies, pg_class)
2. ✗ Ferramentas CLI (psql) não disponíveis no ambiente de deployment
3. ✗ Supabase RPC para pg_policies retorna sem dados
4. ✓ PODEM existir policies configuradas que não foram detectadas

**Conclusão:** Para auditoria completa e confiável, é necessário acessar o **Supabase Console diretamente**.

---

## PRÓXIMOS PASSOS

1. [ ] Acessar console.supabase.com
2. [ ] Executar queries SQL no SQL Editor
3. [ ] Gerar relatório completo de RLS
4. [ ] Criar/atualizar policies conforme necessário
5. [ ] Documenta final das políticas

---

**Auditoria Realizada Por:** v0 (Automated Audit)
**Método:** API REST + SQL Query Attempts
**Status:** INCOMPLETO - Requer acesso direto ao Supabase Console
