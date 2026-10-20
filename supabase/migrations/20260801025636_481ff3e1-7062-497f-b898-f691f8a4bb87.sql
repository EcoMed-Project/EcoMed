-- ROLES
CREATE TYPE public.app_role AS ENUM ('citizen', 'professional', 'admin');
CREATE TYPE public.donation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.request_status AS ENUM ('pending', 'ready', 'completed', 'cancelled');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  cep TEXT,
  cadunico_declared BOOLEAN NOT NULL DEFAULT false,
  cadunico_verified BOOLEAN NOT NULL DEFAULT false,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Professionals read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Professionals read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Professionals update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, cep, cadunico_declared)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'cep',
    COALESCE((NEW.raw_user_meta_data->>'cadunico_declared')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- HEALTH POSTS
CREATE TABLE public.health_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  cep TEXT NOT NULL,
  phone TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accepts_donations BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.health_posts TO anon;
GRANT SELECT ON public.health_posts TO authenticated;
GRANT ALL ON public.health_posts TO service_role;
ALTER TABLE public.health_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Health posts are public" ON public.health_posts FOR SELECT TO anon, authenticated USING (true);

-- DONATIONS
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_post_id UUID NOT NULL REFERENCES public.health_posts(id),
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'caixa(s)',
  expiry_date DATE NOT NULL,
  sealed BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  status public.donation_status NOT NULL DEFAULT 'pending',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own donations" ON public.donations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Professionals read donations" ON public.donations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Professionals update donations" ON public.donations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));

-- INVENTORY
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_post_id UUID NOT NULL REFERENCES public.health_posts(id),
  donation_id UUID REFERENCES public.donations(id),
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'caixa(s)',
  expiry_date DATE NOT NULL,
  points_cost INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory TO anon;
GRANT SELECT, INSERT, UPDATE ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory is public" ON public.inventory FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Professionals manage inventory" ON public.inventory FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));

-- REQUESTS
CREATE TABLE public.medicine_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  health_post_id UUID NOT NULL REFERENCES public.health_posts(id),
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  points_spent INTEGER NOT NULL DEFAULT 0,
  used_cadunico BOOLEAN NOT NULL DEFAULT false,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.medicine_requests TO authenticated;
GRANT ALL ON public.medicine_requests TO service_role;
ALTER TABLE public.medicine_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own requests" ON public.medicine_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own requests" ON public.medicine_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Professionals read requests" ON public.medicine_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Professionals update requests" ON public.medicine_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));

-- POINTS LEDGER
CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  donation_id UUID REFERENCES public.donations(id),
  request_id UUID REFERENCES public.medicine_requests(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ledger" ON public.points_ledger FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Professionals read ledger" ON public.points_ledger FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'professional') OR public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- TRIGGERS: donation review
CREATE OR REPLACE FUNCTION public.handle_donation_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  awarded INTEGER;
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    awarded := GREATEST(10, NEW.quantity * 10);
    NEW.points_awarded := awarded;
    NEW.reviewed_at := now();

    INSERT INTO public.inventory (health_post_id, donation_id, medicine_name, dosage, quantity, unit, expiry_date, points_cost)
    VALUES (NEW.health_post_id, NEW.id, NEW.medicine_name, NEW.dosage, NEW.quantity, NEW.unit, NEW.expiry_date, GREATEST(5, NEW.quantity * 5));

    UPDATE public.profiles SET points = points + awarded, updated_at = now() WHERE id = NEW.user_id;

    INSERT INTO public.points_ledger (user_id, delta, reason, donation_id)
    VALUES (NEW.user_id, awarded, 'Doação aprovada: ' || NEW.medicine_name, NEW.id);

    INSERT INTO public.notifications (user_id, title, body)
    VALUES (NEW.user_id, 'Doação aprovada!', 'Sua doação de ' || NEW.medicine_name || ' foi aprovada e você recebeu ' || awarded || ' pontos.');
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    NEW.reviewed_at := now();
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (NEW.user_id, 'Doação não aprovada', 'Sua doação de ' || NEW.medicine_name || ' não passou na triagem. ' || COALESCE(NEW.review_notes, ''));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_donation_reviewed
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.handle_donation_review();

-- TRIGGER: request created -> validate points / cadunico, debit points, decrement stock
CREATE OR REPLACE FUNCTION public.handle_request_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.inventory%ROWTYPE;
  prof public.profiles%ROWTYPE;
  cost INTEGER;
BEGIN
  SELECT * INTO inv FROM public.inventory WHERE id = NEW.inventory_id FOR UPDATE;
  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'Medicamento não encontrado no estoque';
  END IF;
  IF inv.quantity < NEW.quantity THEN
    RAISE EXCEPTION 'Quantidade indisponível no estoque';
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = NEW.user_id FOR UPDATE;
  cost := inv.points_cost * NEW.quantity;

  NEW.medicine_name := inv.medicine_name;
  NEW.health_post_id := inv.health_post_id;

  IF prof.cadunico_verified THEN
    NEW.used_cadunico := true;
    NEW.points_spent := 0;
  ELSE
    IF prof.points < cost THEN
      RAISE EXCEPTION 'Pontos insuficientes para solicitar este medicamento';
    END IF;
    NEW.used_cadunico := false;
    NEW.points_spent := cost;
    UPDATE public.profiles SET points = points - cost, updated_at = now() WHERE id = NEW.user_id;
    INSERT INTO public.points_ledger (user_id, delta, reason)
    VALUES (NEW.user_id, -cost, 'Solicitação de ' || inv.medicine_name);
  END IF;

  UPDATE public.inventory SET quantity = quantity - NEW.quantity, updated_at = now() WHERE id = inv.id;

  INSERT INTO public.notifications (user_id, title, body)
  VALUES (NEW.user_id, 'Solicitação registrada', 'Sua solicitação de ' || inv.medicine_name || ' foi registrada. Aguarde a liberação para retirada.');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_request_created
BEFORE INSERT ON public.medicine_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_request_created();

CREATE OR REPLACE FUNCTION public.notify_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    NEW.updated_at := now();
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (NEW.user_id, 'Status da solicitação atualizado',
      'Sua solicitação de ' || NEW.medicine_name || ' está com status: ' ||
      CASE NEW.status WHEN 'ready' THEN 'pronta para retirada' WHEN 'completed' THEN 'retirada confirmada' WHEN 'cancelled' THEN 'cancelada' ELSE 'em análise' END || '.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_request_status_changed
BEFORE UPDATE ON public.medicine_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_request_status();

-- SEED HEALTH POSTS
INSERT INTO public.health_posts (name, address, city, state, cep, phone, lat, lng) VALUES
('UBS Vila Mariana', 'Rua Napoleão de Barros, 715', 'São Paulo', 'SP', '04024-002', '(11) 5576-4848', -23.5993, -46.6398),
('UBS Jardim Paulista', 'Rua Cincinato Braga, 502', 'São Paulo', 'SP', '01333-010', '(11) 3253-1122', -23.5713, -46.6483),
('UBS Butantã', 'Av. Corifeu de Azevedo Marques, 3596', 'São Paulo', 'SP', '05340-002', '(11) 3768-2211', -23.5697, -46.7326),
('UBS Santana', 'Rua Voluntários da Pátria, 3454', 'São Paulo', 'SP', '02402-400', '(11) 2281-9090', -23.4869, -46.6250),
('UBS Ipanema', 'Rua Visconde de Pirajá, 595', 'Rio de Janeiro', 'RJ', '22410-003', '(21) 2247-3300', -22.9838, -43.2096),
('UBS Tijuca', 'Rua Conde de Bonfim, 1045', 'Rio de Janeiro', 'RJ', '20530-002', '(21) 2570-1010', -22.9276, -43.2340),
('UBS Savassi', 'Rua Pernambuco, 1240', 'Belo Horizonte', 'MG', '30130-151', '(31) 3277-4455', -19.9382, -43.9350),
('UBS Boa Viagem', 'Av. Conselheiro Aguiar, 2333', 'Recife', 'PE', '51020-020', '(81) 3355-7788', -8.1216, -34.9016),
('UBS Asa Sul', 'SGAS 613, Lote 96', 'Brasília', 'DF', '70200-730', '(61) 3445-6677', -15.8267, -47.9060),
('UBS Centro Curitiba', 'Rua André de Barros, 750', 'Curitiba', 'PR', '80010-080', '(41) 3350-9900', -25.4372, -49.2733);