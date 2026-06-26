'use client'

import { Bell } from 'lucide-react'
import type { Usuario, Empresa } from '@/types'

interface Props {
  usuario: Usuario
  empresa: Empresa | null
}

export function Header({ usuario, empresa }: Props) {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-56 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 md:px-5">
      {/* Espaço para o botão hambúrguer no mobile */}
      <div className="w-8 md:w-0" />

      {/* Centro — nome da empresa (mobile) */}
      <p className="md:hidden text-sm font-semibold text-gray-700 truncate">{empresa?.nome || 'Fluxy'}</p>

      {/* Direita */}
      <div className="flex items-center gap-3">
        <button className="relative text-gray-400 hover:text-gray-600 transition">
          <Bell size={18} />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
            {usuario.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 leading-tight">{usuario.nome}</p>
            <p className="text-[10px] text-gray-400 capitalize">{usuario.perfil}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
