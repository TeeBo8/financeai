import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez les paramètres de votre compte et de l&apos;application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page en Construction</CardTitle>
          <CardDescription>
            Cette section est en cours de développement et sera bientôt
            disponible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Revenez bientôt pour découvrir les options de paramétrage !</p>
        </CardContent>
      </Card>
    </div>
  );
} 