import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

/**
 * Dispara o envio por e-mail das notificações recentes pendentes.
 * Restrito a profissionais de saúde e administradores.
 */
export const dispatchNotificationEmails = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string }

    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    if (error) throw error
    const allowed = (roles ?? []).some(
      (r: { role: string }) => r.role === 'professional' || r.role === 'admin',
    )
    if (!allowed) {
      throw new Response('Forbidden', { status: 403 })
    }

    const { flushPendingNotificationEmails } = await import('@/lib/notifications.server')
    return await flushPendingNotificationEmails()
  })
