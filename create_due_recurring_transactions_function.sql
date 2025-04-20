CREATE OR REPLACE FUNCTION public.create_due_recurring_transactions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    recurring_record RECORD;
    new_next_occurrence_date DATE;
BEGIN
    -- Boucler sur les enregistrements récurrents échus
    FOR recurring_record IN
        SELECT *
        FROM public."finance-ai_recurring_transaction"
        WHERE next_occurrence_date <= CURRENT_DATE
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    LOOP
        -- Insérer la nouvelle transaction
        INSERT INTO public."finance-ai_transaction" (
            id, 
            "userId", 
            description, 
            amount, 
            date, 
            created_at, 
            updated_at, 
            "categoryId", 
            "bankAccountId",
            transfer_id
        )
        VALUES (
            CONCAT('tx_', gen_random_uuid()),
            recurring_record."userId",
            recurring_record.description,
            recurring_record.amount,
            recurring_record.next_occurrence_date,
            NOW(),
            NOW(),
            recurring_record."categoryId",
            recurring_record."bankAccountId",
            NULL
        );

        -- Calculer la prochaine date d'occurrence
        new_next_occurrence_date := recurring_record.next_occurrence_date +
            CASE recurring_record.frequency
                WHEN 'DAILY' THEN (recurring_record.interval * INTERVAL '1 day')
                WHEN 'WEEKLY' THEN (recurring_record.interval * INTERVAL '1 week')
                WHEN 'MONTHLY' THEN (recurring_record.interval * INTERVAL '1 month')
                WHEN 'YEARLY' THEN (recurring_record.interval * INTERVAL '1 year')
                ELSE INTERVAL '1 month' -- Fallback par défaut
            END;

        -- Mettre à jour l'enregistrement récurrent avec la nouvelle date
        UPDATE public."finance-ai_recurring_transaction"
        SET next_occurrence_date = new_next_occurrence_date,
            updated_at = NOW()
        WHERE id = recurring_record.id;

        -- Si la nouvelle date dépasse la date de fin, le modèle sera automatiquement
        -- exclu lors de la prochaine exécution grâce à la condition du WHERE initial
    END LOOP;
    
    -- Enregistrer un log d'exécution (optionnel)
    RAISE NOTICE 'Exécution des transactions récurrentes terminée à %', NOW();
END;
$$; 