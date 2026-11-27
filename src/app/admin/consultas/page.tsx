'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CustomRequest, CustomRequestStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<CustomRequestStatus, string> = {
  nueva: 'Nueva',
  respondida: 'Respondida',
  cerrada: 'Cerrada',
}

export default function AdminConsultasPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<CustomRequest[]>([])
  const [selected, setSelected] = useState<CustomRequest | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<CustomRequestStatus>('nueva')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('custom_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRequests(data as CustomRequest[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openDetail = (req: CustomRequest) => {
    setSelected(req)
    setStatus(req.status)
    setNotes(req.internal_notes || '')
    setReplyMessage(
      `¡Hola ${req.customer_name}! Recibí tu consulta en 3D Copas sobre "${req.description.slice(
        0,
        50
      )}...". Te paso presupuesto:`
    )
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase
      .from('custom_requests')
      .update({ status, internal_notes: notes.trim() || null })
      .eq('id', selected.id)
    setSaving(false)
    if (error) {
      toast.error('Error al guardar.')
      return
    }
    toast.success('Consulta actualizada.')
    setSelected(null)
    loadData()
  }

  const handleReplyWhatsApp = () => {
    if (!selected) return
    const phone = selected.contact_value.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(replyMessage)}`, '_blank')
    setStatus('respondida')
  }

  const handleReplyEmail = () => {
    if (!selected) return
    const subject = encodeURIComponent('Respuesta a tu consulta en 3D Copas')
    const body = encodeURIComponent(replyMessage)
    window.location.href = `mailto:${selected.contact_value}?subject=${subject}&body=${body}`
    setStatus('respondida')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-black text-copas-marino">
          Consultas y pedidos personalizados
        </h1>
        <p className="text-sm text-copas-plata-oscuro">
          Mensajes recibidos desde el botón &ldquo;Pedir algo personalizado&rdquo;.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-card border border-copas-plata p-10 text-center text-copas-plata-oscuro">
          Todavía no hay consultas personalizadas.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              onClick={() => openDetail(req)}
              className="bg-white rounded-card border border-copas-plata p-4 hover:border-copas-azul cursor-pointer transition-all shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="font-heading font-bold text-copas-marino">
                  {req.customer_name}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-heading font-bold ${
                    req.status === 'nueva'
                      ? 'bg-copas-dorado text-copas-marino'
                      : req.status === 'respondida'
                      ? 'bg-copas-verde/15 text-copas-verde'
                      : 'bg-copas-plata/50 text-copas-marino'
                  }`}
                >
                  {STATUS_LABELS[req.status]}
                </span>
              </div>
              <p className="text-sm text-copas-marino/80 line-clamp-2 mb-2">{req.description}</p>
              <p className="text-xs text-copas-plata-oscuro">
                {formatDate(req.created_at)} ·{' '}
                {req.contact_type === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}:{' '}
                {req.contact_value}
                {req.approximate_size ? ` · Medidas: ${req.approximate_size}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Consulta de ${selected.customer_name}` : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-copas-crema rounded-xl p-3.5 text-sm space-y-1.5">
              <p>
                <strong>Contacto ({selected.contact_type}):</strong> {selected.contact_value}
              </p>
              {selected.approximate_size && (
                <p>
                  <strong>Medidas aproximadas:</strong> {selected.approximate_size}
                </p>
              )}
              <p className="pt-1 text-copas-marino">{selected.description}</p>
            </div>

            {selected.reference_photo_url && (
              <div>
                <p className="text-xs font-heading font-bold text-copas-plata-oscuro mb-1">
                  Foto de referencia:
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.reference_photo_url}
                  alt="Referencia"
                  className="max-h-60 rounded-lg border border-copas-plata object-contain"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                Mensaje de respuesta (editable)
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={3}
                className="w-full border-2 border-copas-plata rounded-lg p-2.5 text-sm"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {selected.contact_type === 'whatsapp' && (
                  <Button type="button" size="sm" onClick={handleReplyWhatsApp}>
                    💬 Responder por WhatsApp
                  </Button>
                )}
                {selected.contact_type === 'email' && (
                  <Button type="button" size="sm" onClick={handleReplyEmail}>
                    ✉️ Responder por Email
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-copas-plata">
              <div>
                <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CustomRequestStatus)}
                  className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="nueva">Nueva</option>
                  <option value="respondida">Respondida</option>
                  <option value="cerrada">Cerrada</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                  Notas internas
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <Button className="w-full" loading={saving} onClick={handleSave}>
              Guardar cambios
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
