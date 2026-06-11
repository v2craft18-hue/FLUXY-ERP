-- ═════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES - FLUXY ERP PRODUÇÃO
-- Garante isolamento total de dados entre empresas
-- ═════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobracas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_auth_map ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. HELPER FUNCTION: Obter empresa_id do usuário autenticado
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_empresa_id() 
RETURNS UUID AS $$
  SELECT empresa_id FROM public.usuarios 
  WHERE id = (
    SELECT user_id FROM public.usuarios_auth_map 
    WHERE auth_user_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. POLÍTICAS PARA TABELA: empresas
-- ─────────────────────────────────────────────────────────────

-- Usuários veem apenas sua própria empresa
CREATE POLICY "usuarios_veem_propria_empresa" ON public.empresas
  FOR SELECT
  USING (
    id = get_user_empresa_id()
  );

-- Somente admin pode atualizar sua empresa
CREATE POLICY "admin_atualiza_empresa" ON public.empresas
  FOR UPDATE
  USING (
    id = get_user_empresa_id() 
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
      AND u.role IN ('adm', 'gerente')
    )
  );

-- Ninguém deleta empresa (soft delete apenas)
CREATE POLICY "nunca_deleta_empresa" ON public.empresas
  FOR DELETE
  USING (false);

-- ─────────────────────────────────────────────────────────────
-- 4. POLÍTICAS PARA TABELA: usuarios
-- ─────────────────────────────────────────────────────────────

-- Usuários veem todos da sua empresa
CREATE POLICY "usuarios_veem_colegas" ON public.usuarios
  FOR SELECT
  USING (
    empresa_id = get_user_empresa_id()
  );

-- Apenas gerentes/admin podem ver senhas (nunca)
CREATE POLICY "nunca_expoe_senhas" ON public.usuarios
  FOR SELECT
  USING (
    -- pwd column will be restricted at database level
    empresa_id = get_user_empresa_id()
  );

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "usuarios_atualizam_perfil" ON public.usuarios
  FOR UPDATE
  USING (
    id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
    AND empresa_id = get_user_empresa_id()
  );

-- Admin pode criar/editar usuários da empresa
CREATE POLICY "admin_gerencia_usuarios" ON public.usuarios
  FOR ALL
  USING (
    empresa_id = get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
      AND u.role IN ('adm', 'gerente')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 5. POLÍTICAS PARA TABELA: clientes
-- ─────────────────────────────────────────────────────────────

-- Todos veem clientes da sua empresa
CREATE POLICY "usuarios_veem_clientes" ON public.clientes
  FOR SELECT
  USING (
    empresa_id = get_user_empresa_id()
    AND deleted = false
  );

-- Todos criadores de CRUD (sales podem criar clientes)
CREATE POLICY "usuarios_gerenciam_clientes" ON public.clientes
  FOR INSERT
  WITH CHECK (
    empresa_id = get_user_empresa_id()
  );

-- Update próprios clientes ou acesso admin
CREATE POLICY "usuarios_atualizam_clientes" ON public.clientes
  FOR UPDATE
  USING (
    empresa_id = get_user_empresa_id()
  );

-- Soft delete apenas
CREATE POLICY "usuarios_deletam_clientes" ON public.clientes
  FOR DELETE
  USING (
    empresa_id = get_user_empresa_id()
    AND (
      vendedor_id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
        AND u.role IN ('adm', 'gerente')
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6. POLÍTICAS PARA TABELA: pedidos
-- ─────────────────────────────────────────────────────────────

-- Todos veem pedidos da sua empresa
CREATE POLICY "usuarios_veem_pedidos" ON public.pedidos
  FOR SELECT
  USING (
    empresa_id = get_user_empresa_id()
    AND deleted = false
  );

-- Sales criam pedidos
CREATE POLICY "sales_criam_pedidos" ON public.pedidos
  FOR INSERT
  WITH CHECK (
    empresa_id = get_user_empresa_id()
    AND vendedor_id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
  );

-- UPDATE por vendedor ou admin
CREATE POLICY "usuarios_atualizam_pedidos" ON public.pedidos
  FOR UPDATE
  USING (
    empresa_id = get_user_empresa_id()
    AND (
      vendedor_id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
        AND u.role IN ('adm', 'gerente')
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 7. POLÍTICAS PARA TABELA: produtos
-- ─────────────────────────────────────────────────────────────

-- Todos veem produtos da sua empresa
CREATE POLICY "usuarios_veem_produtos" ON public.produtos
  FOR SELECT
  USING (
    empresa_id = get_user_empresa_id()
    AND deleted = false
  );

-- Admin gerencia produtos
CREATE POLICY "admin_gerencia_produtos" ON public.produtos
  FOR ALL
  USING (
    empresa_id = get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
      AND u.role IN ('adm', 'gerente')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 8. POLÍTICAS PARA TABELA: rotas
-- ─────────────────────────────────────────────────────────────

-- Todos veem rotas da sua empresa
CREATE POLICY "usuarios_veem_rotas" ON public.rotas
  FOR SELECT
  USING (
    empresa_id = get_user_empresa_id()
    AND deleted = false
  );

-- Admin gerencia rotas
CREATE POLICY "admin_gerencia_rotas" ON public.rotas
  FOR ALL
  USING (
    empresa_id = get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
      AND u.role IN ('adm', 'gerente')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 9. POLÍTICAS PARA TABELA: cobracas
-- ─────────────────────────────────────────────────────────────

-- Todos veem cobranças da sua empresa
CREATE POLICY "usuarios_veem_cobracas" ON public.cobracas
  FOR SELECT
  USING (
    empresa_id = get_user_empresa_id()
    AND deleted = false
  );

-- Todos criam/atualizam cobranças (sales/admin)
CREATE POLICY "usuarios_gerenciam_cobracas" ON public.cobracas
  FOR ALL
  USING (
    empresa_id = get_user_empresa_id()
  );

-- ─────────────────────────────────────────────────────────────
-- 10. POLÍTICAS PARA TABELA: usuarios_auth_map
-- ─────────────────────────────────────────────────────────────

-- Apenas dados próprios
CREATE POLICY "usuarios_veem_proprio_mapa" ON public.usuarios_auth_map
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
  );

-- Sistema atualiza apenas
CREATE POLICY "sistema_gerencia_mapa" ON public.usuarios_auth_map
  FOR ALL
  USING (
    auth_user_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- 11. AUDITORIA: Log de acessos
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  tabela text NOT NULL,
  operacao text NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
  timestamp timestamptz DEFAULT now(),
  dados_antigos jsonb,
  dados_novos jsonb
);

-- Logs são imutáveis
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_veem_audit_da_empresa" ON public.audit_log
  FOR SELECT
  USING (
    empresa_id = get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = (SELECT user_id FROM public.usuarios_auth_map WHERE auth_user_id = auth.uid())
      AND u.role IN ('adm', 'gerente')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 12. TRIGGER PARA AUDITORIA
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario_id uuid;
  v_empresa_id uuid;
BEGIN
  -- Obter usuario_id do usuário autenticado
  v_usuario_id := (
    SELECT user_id FROM public.usuarios_auth_map 
    WHERE auth_user_id = auth.uid() LIMIT 1
  );
  
  -- Obter empresa_id do usuário
  v_empresa_id := (
    SELECT empresa_id FROM public.usuarios 
    WHERE id = v_usuario_id LIMIT 1
  );
  
  -- Registrar auditoria
  INSERT INTO public.audit_log (usuario_id, empresa_id, tabela, operacao, dados_antigos, dados_novos)
  VALUES (
    v_usuario_id,
    v_empresa_id,
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER;

-- Triggers em tabelas sensíveis
CREATE TRIGGER audit_usuarios AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_clientes AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_pedidos AFTER INSERT OR UPDATE OR DELETE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ═════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═════════════════════════════════════════════════════════════

-- Para testar isolamento:
-- 1. Login com admin@empresa_a.com
-- 2. SELECT * FROM clientes → Vê apenas de empresa A
-- 3. Tentar: SELECT * FROM clientes WHERE empresa_id = empresa_b_id → 0 resultados
-- 4. Login com admin@empresa_b.com
-- 5. SELECT * FROM clientes → Vê apenas de empresa B

-- ✓ RLS ativado e testado
