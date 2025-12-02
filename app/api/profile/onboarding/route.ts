import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  ensureOnboardingTasks,
  fetchOnboardingTasks,
  SERVER_MANAGED_TASKS,
} from "@/lib/onboarding";
import {
  ONBOARDING_TASK_SEQUENCE,
  OnboardingStatus,
  OnboardingTaskKey,
} from "@/lib/constants/onboarding";

const ALLOWED_STATUSES: OnboardingStatus[] = [
  "pending",
  "in_progress",
  "submitted",
  "completed",
];

const TASK_KEY_SET = new Set<OnboardingTaskKey>(ONBOARDING_TASK_SEQUENCE);

type PatchPayload = {
  taskKey?: OnboardingTaskKey;
  status?: OnboardingStatus;
  metadata?: Record<string, unknown> | null;
};

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: PatchPayload = await request.json();
    const { taskKey, status, metadata } = body;

    if (!taskKey || !TASK_KEY_SET.has(taskKey)) {
      return NextResponse.json(
        { error: "Invalid onboarding task" },
        { status: 400 }
      );
    }

    if (SERVER_MANAGED_TASKS.has(taskKey)) {
      return NextResponse.json(
        { error: "This task is automatically managed" },
        { status: 400 }
      );
    }

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    if (taskKey !== "kickoff_request" && status === "submitted") {
      return NextResponse.json(
        { error: "Submitted status only applies to kickoff requests" },
        { status: 400 }
      );
    }

    const pool = getPool();
    await ensureOnboardingTasks(pool, user.accountId);

    const existingTaskResult = await pool.query<{
      metadata: Record<string, unknown> | null;
    }>(
      `
        SELECT metadata
        FROM onboarding_tasks
        WHERE account_id = $1 AND task_key = $2
      `,
      [user.accountId, taskKey]
    );

    if (existingTaskResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Unable to load onboarding task" },
        { status: 404 }
      );
    }

    const existingMetadata = existingTaskResult.rows[0].metadata ?? null;

    let nextMetadata: Record<string, unknown> | null;
    if (metadata === undefined) {
      nextMetadata = existingMetadata;
    } else if (metadata === null) {
      nextMetadata = null;
    } else if (typeof metadata === "object") {
      nextMetadata = metadata;
    } else {
      return NextResponse.json(
        { error: "metadata must be an object" },
        { status: 400 }
      );
    }

    if (taskKey === "kickoff_request") {
      if (status === "submitted") {
        const kickoffDate = (metadata as { kickoffDate?: string })?.kickoffDate;

        if (!kickoffDate) {
          return NextResponse.json(
            { error: "kickoffDate is required" },
            { status: 400 }
          );
        }

        const kickoffDateObj = new Date(kickoffDate);
        if (Number.isNaN(kickoffDateObj.valueOf())) {
          return NextResponse.json(
            { error: "kickoffDate must be a valid ISO date" },
            { status: 400 }
          );
        }

        const isMonday = kickoffDateObj.getUTCDay() === 1;
        if (!isMonday) {
          return NextResponse.json(
            { error: "Kickoff requests must land on a Monday" },
            { status: 400 }
          );
        }

        nextMetadata = {
          requestedKickoffDate: kickoffDateObj.toISOString(),
          requestedKickoffDateLabel: kickoffDate,
          requestedBy: user.email,
          requestedAt: new Date().toISOString(),
        };
      }
    } else if (
      nextMetadata !== null &&
      Object.keys(nextMetadata).length === 0
    ) {
      nextMetadata = null;
    }

    const updateResult = await pool.query(
      `
        UPDATE onboarding_tasks
        SET status = $3,
            metadata = $4,
            completed_at = CASE WHEN $3 = 'completed' THEN COALESCE(completed_at, now()) ELSE NULL END,
            updated_at = now()
        WHERE account_id = $1 AND task_key = $2
      `,
      [user.accountId, taskKey, status, nextMetadata]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Unable to update onboarding task" },
        { status: 400 }
      );
    }

    const onboardingTasks = await fetchOnboardingTasks(pool, user.accountId);

    return NextResponse.json({
      onboardingTasks: onboardingTasks.map((task) => ({
        accountId: task.account_id,
        taskKey: task.task_key,
        status: task.status,
        metadata: task.metadata,
        completedAt: task.completed_at,
        updatedAt: task.updated_at,
        createdAt: task.created_at,
      })),
    });
  } catch (error) {
    console.error("Error updating onboarding task:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding task" },
      { status: 500 }
    );
  }
}

