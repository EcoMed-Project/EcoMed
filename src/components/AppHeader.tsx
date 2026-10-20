import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, Menu, LogOut, Award } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";


const baseLinks = [
  { to: "/", label: "Início" },
  { to: "/medicamentos", label: "Medicamentos" },
  { to: "/descarte", label: "Descarte" },
];

export function AppHeader() {
  const { session, profile, isProfessional } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const links = [
    ...baseLinks,
    ...(session ? [{ to: "/doar", label: "Doar" }, { to: "/historico", label: "Histórico" }] : []),
    ...(isProfessional ? [{ to: "/painel", label: "Painel profissional" }] : []),
  ];

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            EcoMed <span className="text-primary">Brasil</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              activeProps={{ className: "bg-primary-soft text-primary" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <NotificationBell />
              <Link

                to="/perfil"
                className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary"
              >
                <Award className="size-4" />
                {profile?.points ?? 0} pts
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ modo: "cadastro" }}>
                  Criar conta
                </Link>
              </Button>
            </>
          )}
        </div>

        {session && (
          <div className="ml-auto md:hidden">
            <NotificationBell />
          </div>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className={session ? "md:hidden" : "ml-auto md:hidden"}>

            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="mt-8 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-primary-soft"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-border pt-4">
                {session ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/perfil"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-base font-medium"
                    >
                      Meu perfil · {profile?.points ?? 0} pts
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        void handleSignOut();
                      }}
                    >
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" asChild>
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Entrar ou criar conta
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
