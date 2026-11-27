'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { compressImageFile } from '@/lib/image-compress'
import toast from 'react-hot-toast'

interface Props {
  whatsapp?: string
}

export default function ModalPersonalizado({ whatsapp }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    contactType: 'whatsapp' as 'whatsapp' | 'email',
    contactValue: '',
    description: '',
    approximateSize: '',
  })
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null)

  const handleClose = () => {
    setOpen(false)
    router.push('/', { scroll: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerName.trim() || !form.contactValue.trim() || !form.description.trim()) {
      toast.error('Por favor completá los campos obligatorios.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    let referencePhotoUrl: string | null = null

    if (referencePhoto) {
      try {
        const compressed = await compressImageFile(referencePhoto, 1200, 0.8)
        const fileExt = compressed.name.split('.').pop() || 'webp'
        const fileName = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('requests')
          .upload(fileName, compressed)

        if (!uploadError && uploadData) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('requests').getPublicUrl(uploadData.path)
          referencePhotoUrl = publicUrl
        }
      } catch (err) {
        console.error('Error comprimiendo/subiendo foto de referencia:', err)
      }
    }

    const { error } = await supabase.from('custom_requests').insert({
      customer_name: form.customerName.trim(),
      contact_type: form.contactType,
      contact_value: form.contactValue.trim(),
      description: form.description.trim(),
      approximate_size: form.approximateSize.trim() || null,
      reference_photo_url: referencePhotoUrl,
    })

    setLoading(false)

    if (error) {
      toast.error('No se pudo enviar la consulta. Intentá de nuevo o escribime por WhatsApp.')
      return
    }

    setSubmitted(true)
  }

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('¡Hola! Quiero hacer un pedido personalizado.')}`
    : null

  return (
    <Modal open={open} onClose={handleClose} title="Pedir algo personalizado" size="lg">
      {submitted ? (
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <div className="text-6xl">✅</div>
          <h3 className="font-heading text-xl font-bold text-copas-verde">¡Consulta enviada!</h3>
          <p className="text-copas-plata-oscuro text-center">
            Recibí tu consulta y te voy a responder pronto por{' '}
            {form.contactType === 'whatsapp' ? 'WhatsApp' : 'email'}.
          </p>
          <Button onClick={handleClose}>Volver a la tienda</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-copas-plata-oscuro">
            Contame qué querés imprimir en 3D y te paso presupuesto. Si preferís, también podés
            escribirme directo por WhatsApp.
          </p>

          <Input
            label="Tu nombre *"
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="Ej: Sofía García"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-heading font-semibold text-copas-marino">
              ¿Por dónde te respondo? *
            </label>
            <div className="flex gap-2">
              {(['whatsapp', 'email'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, contactType: type, contactValue: '' }))}
                  className={`flex-1 py-2 rounded-lg border-2 font-heading font-semibold text-sm transition-all ${
                    form.contactType === type
                      ? 'border-copas-azul bg-copas-azul text-white'
                      : 'border-copas-plata text-copas-marino'
                  }`}
                >
                  {type === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                </button>
              ))}
            </div>
            <input
              type={form.contactType === 'email' ? 'email' : 'tel'}
              value={form.contactValue}
              onChange={(e) => setForm((f) => ({ ...f, contactValue: e.target.value }))}
              placeholder={
                form.contactType === 'whatsapp' ? 'Tu número de WhatsApp (ej: 2266...)' : 'tu@email.com'
              }
              required
              className="mt-1 w-full border-2 border-copas-plata rounded-lg px-4 py-2.5 text-copas-marino focus:outline-none focus:border-copas-azul"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-heading font-semibold text-copas-marino">
              ¿Qué querés? *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Contame qué necesitás: cortante, sello, luz, adorno, colores, cantidad..."
              rows={4}
              required
              className="w-full border-2 border-copas-plata rounded-lg p-3 text-copas-marino focus:outline-none focus:border-copas-azul resize-none"
            />
          </div>

          <Input
            label="Medidas aproximadas (opcional)"
            value={form.approximateSize}
            onChange={(e) => setForm((f) => ({ ...f, approximateSize: e.target.value }))}
            placeholder="Ej: 10 x 8 cm"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-heading font-semibold text-copas-marino">
              Foto de referencia (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReferencePhoto(e.target.files?.[0] || null)}
              className="text-sm text-copas-plata-oscuro file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-copas-crema file:text-copas-marino file:font-semibold"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              Enviar consulta
            </Button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-2 border-copas-verde text-copas-verde px-4 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-copas-verde hover:text-white transition-all"
              >
                💬 Escribime por WhatsApp
              </a>
            )}
          </div>
        </form>
      )}
    </Modal>
  )
}
