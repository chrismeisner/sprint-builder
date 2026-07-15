-- Read-only verification of historical client billing/pricing coverage on the
-- hills side. SELECTs only — safe to run against production.
--   psql "$DATABASE_URL" -f scripts/verify-hill-billing.sql
-- Run BEFORE the backfill to see the gap, and AFTER to confirm it closed.

\echo '== 1. Legacy vs hills record counts (data preserved either way) =='
SELECT 'sprint_drafts'        AS legacy_table, count(*) AS legacy_rows,
       (SELECT count(*) FROM hills WHERE type='sprint')            AS hill_rows
  FROM sprint_drafts
UNION ALL
SELECT 'refinement_cycles', count(*),
       (SELECT count(*) FROM hills WHERE type='refinement_cycle')
  FROM refinement_cycles
UNION ALL
SELECT 'sprint_deliverables', count(*),
       (SELECT count(*) FROM hill_deliverables WHERE legacy_source='sprint_deliverables')
  FROM sprint_deliverables;

\echo ''
\echo '== 2. Invoices: legacy present vs mirrored into hill_invoices =='
SELECT 'sprint_invoices'        AS source,
       (SELECT count(*) FROM sprint_invoices)                                     AS legacy_rows,
       (SELECT count(*) FROM hill_invoices WHERE legacy_source='sprint_invoices') AS hill_rows
UNION ALL
SELECT 'refinement deposits (real)',
       (SELECT count(*) FROM refinement_cycles
         WHERE stripe_deposit_invoice_id IS NOT NULL OR deposit_paid_at IS NOT NULL),
       (SELECT count(*) FROM hill_invoices WHERE legacy_source='refinement_cycle_deposit')
UNION ALL
SELECT 'refinement finals (real)',
       (SELECT count(*) FROM refinement_cycles
         WHERE stripe_final_invoice_id IS NOT NULL OR final_paid_at IS NOT NULL),
       (SELECT count(*) FROM hill_invoices WHERE legacy_source='refinement_cycle_final');

\echo ''
\echo '== 3. Pricing gap: sprint hills that would show $0 in the new view =='
\echo '   (have a contract total but no priced deliverable lines yet)'
SELECT count(*) AS sprint_hills_with_total,
       count(*) FILTER (
         WHERE COALESCE((SELECT SUM(price) FROM hill_deliverables d
                          WHERE d.hill_id = h.id AND d.dismissed_at IS NULL), 0) = 0
       ) AS would_show_zero
  FROM hills h
 WHERE h.type = 'sprint'
   AND NULLIF(h.type_data->>'total_fixed_price','') IS NOT NULL
   AND (h.type_data->>'total_fixed_price')::numeric > 0;

\echo ''
\echo '== 4. Backfilled sprint deliverable lines still missing a price =='
SELECT count(*) AS sprint_lines_without_price
  FROM hill_deliverables
 WHERE legacy_source = 'sprint_deliverables' AND dismissed_at IS NULL AND price IS NULL;

\echo ''
\echo '== 5. Per-engagement reconciliation (top 15 by total) =='
\echo '   contract_total = stored; priced_sum = new price column; invoiced = hill_invoices'
SELECT h.type,
       left(coalesce(h.title,'(untitled)'), 32) AS engagement,
       (h.type_data->>'total_fixed_price')::numeric AS sprint_total,
       (h.type_data->>'total_price')::numeric       AS refinement_total,
       COALESCE((SELECT SUM(price * COALESCE(quantity,1)) FROM hill_deliverables d
                  WHERE d.hill_id = h.id AND d.dismissed_at IS NULL), 0) AS priced_sum,
       COALESCE((SELECT SUM(amount) FROM hill_invoices i
                  WHERE i.hill_id = h.id AND i.invoice_status <> 'voided'), 0) AS invoiced,
       COALESCE((SELECT SUM(amount) FROM hill_invoices i
                  WHERE i.hill_id = h.id AND i.invoice_status = 'paid'), 0) AS paid
  FROM hills h
 WHERE h.type IN ('sprint','refinement_cycle')
 ORDER BY GREATEST(
            COALESCE((h.type_data->>'total_fixed_price')::numeric,0),
            COALESCE((h.type_data->>'total_price')::numeric,0)) DESC
 LIMIT 15;
