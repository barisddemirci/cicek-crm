import { supabase } from './supabase'

const SUPABASE_URL = 'https://qycsekkegulnqmiepjnc.supabase.co'

export const sendReminderEmail = async (event, tenant) => {
  const customer = event.customers
  
  if (!customer?.email) {
    throw new Error('Müşteri email adresi bulunamadı')
  }

  // Mesaj şablonunu hazırla
  let messageHtml = tenant.message_template || getDefaultTemplate()
  
  // Değişkenleri değiştir
  messageHtml = messageHtml
    .replace(/{müşteri_adı}/g, customer.first_name || 'Değerli Müşterimiz')
    .replace(/{etkinlik_türü}/g, event.event_type || '')
    .replace(/{işletme_adı}/g, tenant.business_name || '')
  
  // HTML formatına çevir
  messageHtml = messageHtml.replace(/\n/g, '<br>')
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: customer.email,
      subject: `${tenant.business_name} - Sizin İçin Özel Bir Hatırlatma 🌸`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e06459; margin: 0;">${tenant.business_name}</h1>
          </div>
          <div style="background: #fdf4f3; padding: 30px; border-radius: 12px;">
            <p style="font-size: 16px; line-height: 1.8; color: #44403c;">
              ${messageHtml}
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #a8a29e; font-size: 12px;">
            <p>Bu email ${tenant.business_name} tarafından gönderilmiştir.</p>
          </div>
        </div>
      `
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Email gönderilemedi')
  }

  return result
}

function getDefaultTemplate() {
  return `Sevgili {müşteri_adı},

Tam 1 yıl önce bugün sizin için hazırladığımız özel çiçeklerimizi hatırladık. 🌸

O güzel anıyı sizinle paylaşmak istedik.

Sevgiyle,
{işletme_adı}`
}
