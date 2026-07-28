import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import sucursales from '../data/sucursales.json'

export default function SucursalAutocomplete({ provincia, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  const opciones = useMemo(
    () => sucursales.filter((s) => s.state_id === provincia),
    [provincia],
  )

  useEffect(() => {
    setQuery('')
    setOpen(false)
  }, [provincia])

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return opciones
      .filter((s) => (s.agency_name + ' ' + s.city_name).toLowerCase().includes(q))
      .slice(0, 25)
  }, [opciones, query])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSelect = (sucursal) => {
    onSelect(sucursal)
    setQuery(`${sucursal.agency_name} — ${sucursal.city_name}`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          disabled={!provincia}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder={provincia ? 'Escribí la localidad o el nombre de la sucursal…' : 'Elegí primero tu provincia'}
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {open && resultados.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {resultados.map((s) => (
            <li key={s.agency_id}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 text-sm border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-800">{s.agency_name}</div>
                <div className="text-gray-500 text-xs">
                  {s.city_name}{s.street_full ? ` · ${s.street_full}` : ''}{s.zip_code ? ` · CP ${s.zip_code}` : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim().length >= 2 && resultados.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-2 text-sm text-gray-500">
          No encontramos sucursales con ese nombre en esta provincia.
        </div>
      )}
    </div>
  )
}
