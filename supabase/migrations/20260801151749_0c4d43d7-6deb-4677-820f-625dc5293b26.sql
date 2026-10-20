ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE TABLE public.medicine_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, medicine_name)
);

GRANT SELECT, INSERT, DELETE ON public.medicine_alerts TO authenticated;
GRANT ALL ON public.medicine_alerts TO service_role;
ALTER TABLE public.medicine_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own alerts" ON public.medicine_alerts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own alerts" ON public.medicine_alerts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own alerts" ON public.medicine_alerts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_medicine_available()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_name text;
BEGIN
  SELECT name INTO post_name FROM public.health_posts WHERE id = NEW.health_post_id;

  INSERT INTO public.notifications (user_id, title, body)
  SELECT a.user_id,
         'Medicamento disponível!',
         NEW.medicine_name || COALESCE(' ' || NEW.dosage, '') || ' já está disponível em ' || COALESCE(post_name, 'um posto de saúde') || '.'
  FROM public.medicine_alerts a
  WHERE lower(NEW.medicine_name) LIKE '%' || lower(a.medicine_name) || '%'
     OR lower(a.medicine_name) LIKE '%' || lower(NEW.medicine_name) || '%';

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_medicine_available() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_inventory_available
AFTER INSERT ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.notify_medicine_available();