import { useState } from 'react'
import { Package, CheckCircle2, X } from 'lucide-react'
import SucursalAutocomplete from './components/SucursalAutocomplete'
import { PROVINCIAS } from './lib/provincias'
import { enviarPedido } from './lib/appsScript'
import { WHATSAPP_NUMBER } from './config'

const nuevoForm = {
  nombre: '',
  telefono: '',
  provincia: '',
  tipoEntrega: 'sucursal', // 'sucursal' | 'domicilio'
  localidad: '',
  direccion: '',
  cp: '',
  nota: '',
}

export default function App() {
  const [form, setForm] = useState(nuevoForm)
  const [sucursal, setSucursal] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const provinciaNombre = PROVINCIAS.find((p) => p.id === form.provincia)?.nombre || ''
  const esDomicilio = form.tipoEntrega === 'domicilio'

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleProvinciaChange = (id) => {
    set('provincia', id)
    setSucursal(null)
  }

  const handleTipoEntregaChange = (tipo) => {
    setForm((f) => ({ ...f, tipoEntrega: tipo, localidad: '', direccion: '', cp: '' }))
    setSucursal(null)
  }

  const puedeEnviar = Boolean(
    form.nombre.trim() &&
    form.telefono.trim() &&
    form.provincia &&
    (esDomicilio
      ? form.localidad.trim() && form.direccion.trim() && form.cp.trim()
      : sucursal),
  )

  const armarMensajeWhatsapp = () => {
    const lineas = [
      '¡Hola! Te paso los datos de mi envío 📦',
      '',
      `Nombre: ${form.nombre}`,
      form.telefono ? `WhatsApp: ${form.telefono}` : null,
      '',
    ]

    if (esDomicilio) {
      lineas.push(
        'Entrega: a domicilio',
        `Localidad: ${form.localidad}${provinciaNombre ? `, ${provinciaNombre}` : ''}`,
        `Dirección: ${form.direccion}`,
        form.cp ? `CP: ${form.cp}` : null,
      )
    } else {
      lineas.push(
        'Entrega: retiro en sucursal',
        `Sucursal: ${sucursal.agency_name}`,
        `Localidad: ${sucursal.city_name}${provinciaNombre ? `, ${provinciaNombre}` : ''}`,
        sucursal.street_full ? `Dirección: ${sucursal.street_full}` : null,
        sucursal.zip_code ? `CP: ${sucursal.zip_code}` : null,
      )
    }

    lineas.push(form.nota ? `\nNota: ${form.nota}` : null)
    return lineas.filter(Boolean).join('\n')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!puedeEnviar || enviando) return
    setEnviando(true)
    setError('')

    try {
      await enviarPedido({
        nombre: form.nombre,
        telefono: form.telefono,
        tipoEntrega: esDomicilio ? 'Domicilio' : 'Sucursal',
        provinciaNombre,
        localidad: esDomicilio ? form.localidad : sucursal.city_name,
        sucursalNombre: esDomicilio ? '' : sucursal.agency_name,
        sucursalDireccion: esDomicilio ? form.direccion : (sucursal.street_full || ''),
        sucursalId: esDomicilio ? '' : sucursal.agency_id,
        cp: esDomicilio ? form.cp : sucursal.zip_code,
        nota: form.nota,
      })
    } catch (err) {
      console.error('No se pudo guardar el envío', err)
      // seguimos igual: lo más importante es que le llegue el mensaje por WhatsApp
    }

    const numero = (WHATSAPP_NUMBER || '').replace(/\D/g, '')
    if (numero) {
      const texto = encodeURIComponent(armarMensajeWhatsapp())
      window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
    } else {
      setError('Falta configurar el número de WhatsApp en src/config.js')
    }

    setEnviando(false)
    setEnviado(true)
  }

  const handleNuevoEnvio = () => {
    setForm(nuevoForm)
    setSucursal(null)
    setEnviado(false)
    setError('')
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-rose-500 mb-3" />
          <h1 className="text-lg font-semibold text-gray-800">¡Listo!</h1>
          <p className="text-sm text-gray-500 mt-1">
            Se abrió WhatsApp con tus datos. Solo falta que aprietes enviar ahí para confirmar tu pedido.
          </p>
          <button
            onClick={handleNuevoEnvio}
            className="mt-5 text-sm text-rose-600 hover:text-rose-700 font-medium"
          >
            Cargar otro envío
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rose-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Package className="h-6 w-6 text-rose-500" />
          <h1 className="text-xl font-semibold text-gray-800">Rebe's Way</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Contame cómo querés recibir tu pedido y te confirmo por WhatsApp.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y apellido</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="Ej: María Pérez"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu WhatsApp</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="Ej: 11 2345-6789"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de entrega</label>
            <select
              value={form.tipoEntrega}
              onChange={(e) => handleTipoEntregaChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="sucursal">Retiro en sucursal de Correo Argentino</option>
              <option value="domicilio">Envío a domicilio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
            <select
              value={form.provincia}
              onChange={(e) => handleProvinciaChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              required
            >
              <option value="">Elegí tu provincia…</option>
              {PROVINCIAS.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {esDomicilio ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                <input
                  type="text"
                  value={form.localidad}
                  onChange={(e) => set('localidad', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Ej: San Isidro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (calle, altura, piso y dpto.)</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => set('direccion', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Ej: Av. Libertador 1234, 3° B"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  value={form.cp}
                  onChange={(e) => set('cp', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Ej: 1642"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal de Correo Argentino</label>
                <SucursalAutocomplete provincia={form.provincia} onSelect={setSucursal} />
              </div>

              {sucursal && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm relative">
                  <button
                    type="button"
                    onClick={() => setSucursal(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    aria-label="Quitar sucursal elegida"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="font-medium text-gray-800 pr-5">{sucursal.agency_name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {sucursal.city_name}
                    {sucursal.street_full ? ` · ${sucursal.street_full}` : ''}
                    {sucursal.zip_code ? ` · CP ${sucursal.zip_code}` : ''}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
            <textarea
              value={form.nota}
              onChange={(e) => set('nota', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
              placeholder={esDomicilio ? 'Ej: dejar en portería' : 'Ej: aclaración sobre tu pedido'}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!puedeEnviar || enviando}
            className="w-full rounded-lg bg-rose-500 text-white font-medium py-2.5 text-sm hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {enviando ? 'Enviando…' : 'Enviar por WhatsApp'}
          </button>
        </form>
      </div>
    </div>
  )
}
