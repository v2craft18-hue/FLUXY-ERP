// FLUXY — Hook Pedidos Multi-Tenant
// RLS filtra por empresa_atual() automaticamente nos SELECTs
// empresa_id passado explicitamente nos INSERTs

'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, queries } from '@/lib/supabase'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { Pedido, PedidoFormData, StatusPedido } from '@/types'
import { useAppStore } from '@/store'

const supabase = createClient()

export function usePedidos(filtros?: {
  status?: StatusPedido; data_inicio?: string; data_fim?: string
  cli_id?: string; vend_id?: string; ent_id?: string
}) {
  return useQuery({
    queryKey: ['pedidos', filtros],
    queryFn: async () => {
      let q = supabase.from('pedidos').select(queries.pedidoLista).order('criado_em', { ascending: false })
      if (filtros?.status)      q = q.eq('status', filtros.status)
      if (filtros?.cli_id)      q = q.eq('cli_id', filtros.cli_id)
      if (filtros?.vend_id)     q = q.eq('vend_id', filtros.vend_id)
      if (filtros?.ent_id)      q = q.eq('ent_id', filtros.ent_id)
      if (filtros?.data_inicio) q = q.gte('data', filtros.data_inicio)
      if (filtros?.data_fim)    q = q.lte('data', filtros.data_fim)
      const { data, error } = await q
      if (error) throw error
      return data as unknown as Pedido[]
    },
  })
}

export function usePedido(id: string | null) {
  return useQuery({
    queryKey: ['pedido', id], enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('pedidos').select(queries.pedidoCompleto).eq('id', id!).single()
      if (error) throw error
      return data as unknown as Pedido
    },
  })
}

export function useCriarPedido() {
  const qc = useQueryClient()
  const { usuario, empresaId } = useAppStore()
  return useMutation({
    mutationFn: async (form: PedidoFormData) => {
      if (!empresaId) throw new Error('Empresa não identificada.')
      const subtotal = form.itens.reduce((a, i) => a + i.tot, 0)
      const total = Math.max(0, subtotal - form.desconto + form.taxa_entrega)
      const { data: ped, error } = await supabase.from('pedidos').insert({
        empresa_id: empresaId, cli_id: form.cli_id, vend_id: form.vend_id || null,
        ent_id: form.ent_id || null, data_ent: form.data_ent || null,
        hora_ent: form.hora_ent || null, origem: form.origem || 'balcao',
        subtotal, desconto: form.desconto, taxa_entrega: form.taxa_entrega,
        total, momento_pag: form.momento_pag, obs: form.obs || null,
      }).select().single()
      if (error) throw error
      const { error: errItens } = await supabase.from('pedido_itens').insert(form.itens.map(i => ({ ...i, ped_id: ped.id })))
      if (errItens) throw errItens
      const pago = form.momento_pag === 'pedido'
      await supabase.from('pagamentos').insert({
        ped_id: ped.id, forma: form.pag_forma, valor: form.pag_valor || total,
        momento: form.momento_pag, status: pago ? 'pago' : 'pendente',
        data_pag: pago ? new Date().toISOString() : null,
        uid_confirmacao: pago ? usuario?.id : null,
      })
      if (pago) {
        const { data: ult } = await supabase.from('caixa').select('saldo').eq('empresa_id', empresaId).order('dt', { ascending: false }).limit(1).single()
        const sal = (ult?.saldo || 0) + (form.pag_valor || total)
        await supabase.from('caixa').insert({ empresa_id: empresaId, tipo: 'recebimento', valor: form.pag_valor || total, saldo_ant: ult?.saldo || 0, saldo: sal, obs: `Pgto ${ped.numero}`, uid: usuario?.id })
      }
      await supabase.from('logs').insert({ empresa_id: empresaId, uid: usuario?.id, acao: 'criar', modulo: 'pedidos', rid: ped.id, det: `Criado: ${ped.numero}` })
      return ped
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pedidos'] }); toast.success('Pedido criado!') },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  })
}

export function useAvancarStatus() {
  const qc = useQueryClient()
  const { usuario, empresaId } = useAppStore()
  return useMutation({
    mutationFn: async ({ id, status_atual, proximo }: { id: string; status_atual: StatusPedido; proximo: StatusPedido }) => {
      const { error } = await supabase.from('pedidos').update({ status: proximo }).eq('id', id)
      if (error) throw error
      await supabase.from('logs').insert({ empresa_id: empresaId, uid: usuario?.id, acao: 'editar', modulo: 'kanban', rid: id, det: `${status_atual} → ${proximo}` })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pedidos'] }); qc.invalidateQueries({ queryKey: ['kanban'] }) },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  })
}

export function useMarcarPago() {
  const qc = useQueryClient()
  const { usuario, empresaId } = useAppStore()
  return useMutation({
    mutationFn: async ({ pagId, pedId, valor }: { pagId: string; pedId: string; valor: number }) => {
      const { data: ped } = await supabase.from('pedidos').select('status, numero').eq('id', pedId).single()
      if (!ped || !['pronto_entrega','entregue'].includes(ped.status))
        throw new Error(`Bloqueado: pedido em "${ped?.status}". Finalize a produção primeiro.`)
      const agora = new Date().toISOString()
      await supabase.from('pagamentos').update({ status: 'pago', data_pag: agora, uid_confirmacao: usuario?.id }).eq('id', pagId)
      await supabase.from('pedidos').update({ momento_pag: 'pedido' }).eq('id', pedId)
      const { data: ult } = await supabase.from('caixa').select('saldo').eq('empresa_id', empresaId!).order('dt', { ascending: false }).limit(1).single()
      const sal = (ult?.saldo || 0) + valor
      await supabase.from('caixa').insert({ empresa_id: empresaId, tipo: 'recebimento', valor, saldo_ant: ult?.saldo || 0, saldo: sal, obs: `Pgto — ${ped.numero}`, uid: usuario?.id })
      await supabase.from('logs').insert({ empresa_id: empresaId, uid: usuario?.id, acao: 'editar', modulo: 'pagamentos', rid: pagId, det: `Pago | ${ped.numero} | R$ ${valor}` })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pedidos'] }); qc.invalidateQueries({ queryKey: ['financeiro'] }); toast.success('Pagamento registrado!') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function usePedidosRealtime() {
  const qc = useQueryClient()
  const empresaId = useAppStore(s => s.empresaId)
  useEffect(() => {
    if (!empresaId) return
    const ch = supabase.channel(`pedidos-${empresaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `empresa_id=eq.${empresaId}` }, () => {
        qc.invalidateQueries({ queryKey: ['pedidos'] })
        qc.invalidateQueries({ queryKey: ['kanban'] })
        qc.invalidateQueries({ queryKey: ['dashboard'] })
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [qc, empresaId])
}
