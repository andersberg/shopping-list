import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

export function MainLayout({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn("space-y-4 grid grid-rows-[1fr_auto] h-full", className)}
    >
      <div className="p-4">{children}</div>

      <footer className="w-full">
        <nav>
          <ul className="grid grid-cols-2 px-4 py-2 divide-x divide-slate-800 text-slate-800 bg-slate-300">
            <li className="p-2 text-center">
              <Link to="/">Listor</Link>
            </li>
            <li className="p-2 text-center">
              <Link to="/items">Varor</Link>
            </li>
          </ul>
        </nav>
      </footer>
    </div>
  );
}
