import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import React from "react";

interface SummaryCardProps {
  title: string;
  value: string; // On passe la valeur déjà formatée
  footerText: string | React.ReactNode; // Accepte string ou JSX pour le footer (utile pour couleur)
  icon: React.ReactNode;
}

export function SummaryCard({
  title,
  value,
  footerText,
  icon,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{footerText}</p>
      </CardContent>
    </Card>
  );
} 