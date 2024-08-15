import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

export function MainLayout({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("grid grid-rows-[1fr_auto] h-full", className)}>
      <div className="p-4">{children}</div>

      <footer className="w-full">
        <nav>
          <ul className="grid grid-cols-2 px-4 py-2 divide-x divide-slate-800 text-slate-800 bg-slate-300">
            <li>
              <Link to="/" className="block w-full h-full p-2 text-center">
                Listor
              </Link>
            </li>
            <li>
              <Link to="/items" className="block w-full h-full p-2 text-center">
                Varor
              </Link>
            </li>
          </ul>
        </nav>
      </footer>
    </div>
  );
}
