UPDATE public.health_posts h
SET accepts_donations = (h.cnes_code IS NULL OR EXISTS (SELECT 1 FROM public.cnes_public_units u WHERE u.cnes_code = h.cnes_code));

DROP TABLE public.cnes_public_units;