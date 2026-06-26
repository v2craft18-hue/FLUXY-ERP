'use client'

import { useState, useMemo } from 'react'
import { usePedidos, usePedidosRealtime } from '@/hooks/usePedidos'
import { moeda, dataBR, STATUS_LABELS, STATUS_CORES } from '@/lib/utils'
import { Plus, Search, Filter } from 'lucide-react'
import type { StatusPedido } from '@/types'
import { cn } from '@/lib/utils'

const FILTROS_PERIODO = [
  { value: '',         label: 'Todos os períodos' },
  { value: 'hoje',     label: '📅 Pedidos de Hoje' },
  { value: 'semana',   label: '📅 Esta Semana' },
  { value: 'mes',      label: '📅 Este Mês' },
  { value: 'ent_hoje', label: '🚚 Entregas Hoje' },
  { value: 'atrasado', label: '⚠️ Atrasados' },
  { value: 'agendado', label: '📆 Agendados' },
]

const FILTROS_STATUS: { value: StatusPedido | ''; label: string }[] = [
  { value: '',                 label: 'Todos os status' },
  { value: 'recebido',         label: 'Recebido' },
  { value: 'em_producao',      label: 'Em Produção' },
  { value: 'pronto_embalagem', label: 'Pronto Embalagem' },
  { value: 'embalado',         label: 'Embalado' },
  { value: 'pronto_entrega',   label: 'Pronto Entrega' },
  { value: 'entregue',         label: 'Entregue' },
  { value: 'cancelado',        label: 'Cancelado' },
]

export default function PedidosPage() {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | ''>('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('')

  const { data: pedidos = [], isLoading } = usePedidos(
    filtroStatus ? { status: filtroStatus } : undefined
  )
  usePedidosRealtime()

  const hoje = new Date().toISOString().slice(0, 10)
  const amanha = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  const semIni = (() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  })()
  const naoEntregue = ['recebido','em_producao','pronto_embalagem','embalado','pronto_entrega']

  const filtrados = useMemo(() => {
    return pedidos.filter(p => {
      // Busca
      if (busca) {
        const q = busca.toLowerCase()
        if (!(p.numero?.toLowerCase().includes(q) || p.cliente?.nome?.toLowerCase().includes(q))) return false
      }
      // Período
      const dc = (p.data || '').slice(0, 10)
      const de = (p.data_ent || '').slice(0, 10)
      if (filtroPeriodo === 'hoje')      return dc === hoje
      if (filtroPeriodo === 'semana')    return dc >= semIni && dc <= hoje
      if (filtroPeriodo === 'mes')       return dc.slice(0, 7) === hoje.slice(0, 7)
      if (filtroPeriodo === 'ent_hoje')  return de === hoje
      if (filtroPeriodo === 'atrasado')  return de && de < hoje && naoEntregue.includes(p.status)
      if (filtroPeriodo === 'agendado')  return de && de > hoje && naoEntregue.includes(p.status)
      return true
    })
  }, [pedidos, busca, filtroPeriodo, hoje, semIni])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Pedidos</h1>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          <Plus size={15} /> Novo Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
            placeholder="Buscar por cliente ou número..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value as StatusPedido | '')}
        >
          {FILTROS_STATUS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white"
          value={filtroPeriodo}
          onChange={e => setFiltroPeriodo(e.target.value)}
        >
          {FILTROS_PERIODO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        {filtroPeriodo && (
          <span className="self-center text-xs text-gray-500">
            {FILTROS_PERIODO.find(f => f.value === filtroPeriodo)?.label} ({filtrados.length})
          </span>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Nº</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Criado</th>
                <th className="text-left px-4 py-3">Entrega</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Pagamento</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Nenhum pedido encontrado</td></tr>
              ) : filtrados.map(p => {
                const atrasado = p.data_ent && p.data_ent < hoje && naoEntregue.includes(p.status)
                const cores = STATUS_CORES[p.status]
                const pago = p.pagamentos?.[0]
                return (
                  <tr
                    key={p.id}
                    className={cn('border-t border-gray-100 hover:bg-gray-50', atrasado && 'bg-red-50')}
                  >
                    <td className="px-4 py-3 font-bold text-orange-600">
                      {atrasado && <span className="mr-1">⚠️</span>}
                      {p.numero}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.cliente?.nome || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{dataBR(p.data)}</td>
                    <td className="px-4 py-3 text-xs">
                      {p.data_ent ? dataBR(p.data_ent) : '—'}
                      {p.hora_ent && <span className="ml-1 text-gray-400">{p.hora_ent}</span>}
                    </td>
                    <td className="px-4 py-3 font-bold">{moeda(p.total)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', cores.bg, cores.text)}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pago?.status === 'pago'
                        ? <span className="text-green-600 font-semibold text-xs">💰 Pago</span>
                        : <span className="text-amber-600 font-semibold text-xs">⏳ Na Entrega</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-gray-400 hover:text-orange-500 text-xs">Ver</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
