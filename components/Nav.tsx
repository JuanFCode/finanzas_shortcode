"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio", icon: "◉" },
  { href: "/movimientos", label: "Movimientos", icon: "⇅" },
  { href: "/deudas", label: "Deudas", icon: "◐" },
  { href: "/inversiones", label: "Inversiones", icon: "↗" },
  { href: "/ajustes", label: "Ajustes", icon: "⚙" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:static md:border-0 md:bg-transparent md:pb-0">
      <ul className="mx-auto flex max-w-3xl justify-around md:justify-start md:gap-1 md:px-4">
        {LINKS.map((l) => {
          const activo = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex flex-col items-center px-2 py-2 text-[11px] md:flex-row md:gap-1.5 md:rounded-lg md:px-3 md:text-sm ${
                  activo ? "font-semibold text-accent" : "text-muted"
                }`}
              >
                <span className="text-lg leading-none md:text-sm">{l.icon}</span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
