import { Link } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

export function MainLayout({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <main className="min-h-full p-4 space-y-4">
      <header>
        <h1 className="text-xl font-bold uppercase">{title}</h1>
      </header>

      <div className="">{children}</div>

      <footer className="w-full">
        <nav>
          <ul className="grid grid-cols-2 gap-4">
            <li className="text-center">
              <Link to="/">Listor</Link>
            </li>
            <li className="text-center">
              <Link to="/items">Varor</Link>
            </li>
          </ul>
        </nav>
      </footer>
    </main>
  );
}
