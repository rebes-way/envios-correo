import { APPS_SCRIPT_URL } from '../config'

const isConfigured = () => APPS_SCRIPT_URL && APPS_SCRIPT_URL.startsWith('http')

export async function enviarPedido(data) {
  if (!isConfigured()) return { ok: false, error: 'sin-configurar' }

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('No se pudo guardar el envío')
  return res.json()
}
