import { Pool } from "pg";
import {
  ONBOARDING_TASK_SEQUENCE,
  OnboardingStatus,
  OnboardingTaskKey,
} from "@/lib/constants/onboarding";

export const SERVER_MANAGED_TASKS = new Set<OnboardingTaskKey>(["intake_form"]);

export type OnboardingTaskRow = {
  account_id: string;
  task_key: OnboardingTaskKey;
  status: OnboardingStatus;
  metadata: Record<string, unknown> | null;
  completed_at: string | null;
  updated_at: string;
  created_at: string;
};

export async function ensureOnboardingTasks(
  pool: Pool,
  accountId: string
): Promise<void> {
  const taskKeys = Array.from(ONBOARDING_TASK_SEQUENCE);
  await pool.query(
    `
      INSERT INTO onboarding_tasks (account_id, task_key)
      SELECT $1, task_key
      FROM UNNEST($2::text[]) AS task_key
      ON CONFLICT (account_id, task_key) DO NOTHING
    `,
    [accountId, taskKeys]
  );
}

export async function fetchOnboardingTasks(
  pool: Pool,
  accountId: string
): Promise<OnboardingTaskRow[]> {
  const taskKeys = Array.from(ONBOARDING_TASK_SEQUENCE);
  const result = await pool.query<OnboardingTaskRow>(
    `
      SELECT account_id, task_key, status, metadata, completed_at, created_at, updated_at
      FROM onboarding_tasks
      WHERE account_id = $1
      ORDER BY array_position($2::text[], task_key)
    `,
    [accountId, taskKeys]
  );

  return result.rows;
}

export async function autoUpdateOnboardingTasks(params: {
  pool: Pool;
  accountId: string;
  hasIntakeForm: boolean;
}): Promise<void> {
  const { pool, accountId, hasIntakeForm } = params;
  const updates: Promise<unknown>[] = [];

  if (hasIntakeForm) {
    updates.push(
      pool.query(
        `
          UPDATE onboarding_tasks
          SET status = 'completed',
              completed_at = COALESCE(completed_at, now()),
              updated_at = now()
          WHERE account_id = $1
            AND task_key = 'intake_form'
            AND status <> 'completed'
        `,
        [accountId]
      )
    );
  }

  await Promise.all(updates);
}

