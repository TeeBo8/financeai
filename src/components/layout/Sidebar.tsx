"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings,
  LogOut,
  Tag,
  Landmark,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
}

const NavItem = ({ href, icon, title }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
};

export function Sidebar() {
  return (
    <div className="flex h-full w-full flex-col bg-card py-4">
      <div className="px-4 py-2">
        <h2 className="text-lg font-semibold">FinanceAI</h2>
        <p className="text-xs text-muted-foreground">Gestion financière</p>
      </div>
      <div className="flex-1 overflow-auto px-3 py-6">
        <nav className="flex flex-col gap-1">
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard className="size-4" />}
            title="Tableau de bord"
          />
          <NavItem
            href="/transactions"
            icon={<Receipt className="size-4" />}
            title="Transactions"
          />
          <NavItem
            href="/accounts"
            icon={<Landmark className="size-4" />}
            title="Comptes"
          />
          <NavItem
            href="/budgets"
            icon={<PiggyBank className="size-4" />}
            title="Budgets"
          />
          <NavItem
            href="/categories"
            icon={<Tag className="size-4" />}
            title="Catégories"
          />
          <NavItem
            href="/reports"
            icon={<BarChart3 className="size-4" />}
            title="Rapports"
          />
          <NavItem
            href="/settings"
            icon={<Settings className="size-4" />}
            title="Paramètres"
          />
        </nav>
      </div>
      <div className="border-t px-3 py-4">
        <div className="flex flex-col gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 size-4" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 