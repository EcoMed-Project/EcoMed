CREATE TABLE IF NOT EXISTS public.cnes_public_units (cnes_code TEXT PRIMARY KEY);
GRANT ALL ON public.cnes_public_units TO service_role;
ALTER TABLE public.cnes_public_units ENABLE ROW LEVEL SECURITY;