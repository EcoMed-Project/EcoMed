import { sendTemplateEmail } from '@/lib/email-templates/send-email'

/**
 * Envia por e-mail as notificações recentes ainda não enviadas.
 * Somente chamada por código servidor após verificação de papel.
 */
export async function flushPendingNotificationEmails(limit = 50) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, title, body')
    .eq('email_sent', false)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  if (!notifications?.length) return { sent: 0 }

  const profileCache = new Map<string, { email?: string; name?: string }>()
  let sent = 0

  for (const n of notifications) {
    try {
      let target = profileCache.get(n.user_id)
      if (!target) {
        const [{ data: userRes }, { data: profile }] = await Promise.all([
          supabaseAdmin.auth.admin.getUserById(n.user_id),
          supabaseAdmin.from('profiles').select('full_name').eq('id', n.user_id).maybeSingle(),
        ])
        target = {
          email: userRes?.user?.email ?? undefined,
          name: (profile?.full_name as string | undefined) || undefined,
        }
        profileCache.set(n.user_id, target)
      }

      if (target.email) {
        const result = await sendTemplateEmail('notificacao', target.email, {
          templateData: { title: n.title, body: n.body, name: target.name },
          idempotencyKey: `notificacao-${n.id}`,
        })
        if (result.sent) sent += 1
      }

      await supabaseAdmin.from('notifications').update({ email_sent: true }).eq('id', n.id)
    } catch (err) {
      console.error('Falha ao enviar e-mail de notificação', { id: n.id, err })
    }
  }

  return { sent }
}
