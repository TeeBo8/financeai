"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings,
  LogOut,
  Tag,
  Landmark,
  RefreshCw,
  Calculator,
  Target,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { SheetClose } from "@/components/ui/sheet";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isMobile?: boolean;
}

const NavItem = ({ href, icon, title, isMobile }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  const content = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{title}</span>
    </div>
  );

  if (isMobile) {
    return (
      <SheetClose asChild>
        <Link href={href}>{content}</Link>
      </SheetClose>
    );
  }

  return <Link href={href}>{content}</Link>;
};

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
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
            isMobile={isMobile}
          />
          <NavItem
            href="/transactions"
            icon={<Receipt className="size-4" />}
            title="Transactions"
            isMobile={isMobile}
          />
          <NavItem
            href="/accounts"
            icon={<Landmark className="size-4" />}
            title="Comptes"
            isMobile={isMobile}
          />
          <NavItem
            href="/budgets"
            icon={<PiggyBank className="size-4" />}
            title="Budgets"
            isMobile={isMobile}
          />
          <NavItem
            href="/goals"
            icon={<Target className="size-4" />}
            title="Objectifs"
            isMobile={isMobile}
          />
          <NavItem
            href="/categories"
            icon={<Tag className="size-4" />}
            title="Catégories"
            isMobile={isMobile}
          />
          <NavItem
            href="/recurring"
            icon={<RefreshCw className="size-4" />}
            title="Récurrentes"
            isMobile={isMobile}
          />
          <NavItem
            href="/subscriptions"
            icon={<CreditCard className="size-4" />}
            title="Abonnements"
            isMobile={isMobile}
          />
          <NavItem
            href="/reports"
            icon={<BarChart3 className="size-4" />}
            title="Rapports"
            isMobile={isMobile}
          />
          <NavItem
            href="/tools/loan-calculator"
            icon={<Calculator className="size-4" />}
            title="Calculateur Prêt"
            isMobile={isMobile}
          />
          <NavItem
            href="/settings"
            icon={<Settings className="size-4" />}
            title="Paramètres"
            isMobile={isMobile}
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