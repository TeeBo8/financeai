"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 md:py-24 bg-background text-foreground">
      <div className="container flex max-w-4xl flex-col items-center justify-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Reprenez le contrôle de vos <span className="text-primary">Finances</span> avec Finance<span className="text-primary">AI</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Suivez vos comptes, analysez vos dépenses, maîtrisez vos budgets. Simple, intelligent, et bientôt dopé à l&apos;IA.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {session ? (
            <Button asChild size="lg">
              <Link href="/dashboard">
                Accéder à votre tableau de bord
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="default" onClick={() => signIn("google")}>
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c73 0 134.3 29.1 179.9 73.7L376 137.4c-21.4-22.1-54.1-36.7-98.5-36.7-82.9 0-149.4 67.6-149.4 150.9s66.5 150.9 149.4 150.9c89.3 0 126.5-63.6 130.9-97.1H244v-66h237.3c1.5 10.1 3.7 20.6 3.7 31.5z"></path></svg>
                Se connecter avec Google
              </Button>
              <Button size="lg" variant="secondary" onClick={() => signIn("discord")}>
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="discord" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.246,69.131a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.752,405.7a1.976,1.976,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"></path></svg>
                Se connecter avec Discord
              </Button>
            </div>
          )}
        </div>

        <div className="mt-10 w-full max-w-3xl">
          <Image
            src="/images/financeai-screenshot-reports.png"
            alt="Aperçu du tableau de bord FinanceAI"
            className="rounded-lg shadow-xl border border-border"
            width={1200}
            height={675}
          />
        </div>
      </div>
    </main>
  );
} 