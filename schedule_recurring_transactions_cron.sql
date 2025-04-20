-- S'assurer que l'extension pg_cron est activée (à exécuter une seule fois)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer la tâche planifiée existante si nécessaire
SELECT cron.unschedule('daily-recurring-transactions');

-- Planifier l'exécution quotidienne à 2h00 UTC
SELECT cron.schedule(
    'daily-recurring-transactions',  -- Nom unique pour la tâche
    '0 2 * * *',                    -- Expression Cron: à 2h00 tous les jours
    $$SELECT public.create_due_recurring_transactions()$$  -- Commande SQL à exécuter
);

-- Vérifier que la tâche est bien programmée
SELECT * FROM cron.job WHERE jobname = 'daily-recurring-transactions'; 