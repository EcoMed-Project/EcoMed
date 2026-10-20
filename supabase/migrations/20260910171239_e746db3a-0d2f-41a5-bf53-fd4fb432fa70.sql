CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, cep, cadunico_declared, points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'cep',
    COALESCE((NEW.raw_user_meta_data->>'cadunico_declared')::boolean, false),
    30
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.points_ledger
    WHERE user_id = NEW.id AND reason = 'Bônus de boas-vindas'
  ) THEN
    INSERT INTO public.points_ledger (user_id, delta, reason)
    VALUES (NEW.id, 30, 'Bônus de boas-vindas');

    INSERT INTO public.notifications (user_id, title, body)
    VALUES (NEW.id, 'Você ganhou 30 pontos!', 'Presente de boas-vindas do EcoMed Brasil: 30 pontos para começar a usar a plataforma.');
  END IF;

  RETURN NEW;
END;
$function$;

WITH faltantes AS (
  SELECT p.id
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.points_ledger l
    WHERE l.user_id = p.id AND l.reason = 'Bônus de boas-vindas'
  )
), ledger AS (
  INSERT INTO public.points_ledger (user_id, delta, reason)
  SELECT id, 30, 'Bônus de boas-vindas' FROM faltantes
  RETURNING user_id
)
UPDATE public.profiles p
SET points = p.points + 30, updated_at = now()
FROM ledger
WHERE p.id = ledger.user_id;