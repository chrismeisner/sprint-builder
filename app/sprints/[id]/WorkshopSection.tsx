"use client";

import { useState } from "react";

type WorkshopAgenda = {
  title?: string;
  duration?: number;
  objectives?: string[];
  agenda?: {
    section?: string;
    duration?: number;
    description?: string;
    activities?: string[];
    materials?: string[];
    facilitator?: string;
    participants?: string;
    output?: string;
  }[];
  exercises?: {
    name?: string;
    source?: string;
    purpose?: string;
    bestFor?: string;
    timing?: string;
    howToRun?: string[];
  }[];
  clientPreparation?: {
    beforeWorkshop?: string[];
    toBring?: string[];
    attendees?: string[];
    timeCommitment?: string;
  };
  expectedOutcomes?: string[];
  nextSteps?: string[];
  notes?: string[];
};

type WorkshopSectionProps = {
  sprintId: string;
  sprintStatus: string;
  workshopAgenda: WorkshopAgenda | null;
  workshopGeneratedAt: string | null;
  isAdmin: boolean;
};

export default function WorkshopSection({
  sprintId,
  sprintStatus,
  workshopAgenda: initialWorkshop,
  workshopGeneratedAt: initialGeneratedAt,
  isAdmin,
}: WorkshopSectionProps) {
  const [workshopAgenda, setWorkshopAgenda] = useState<WorkshopAgenda | null>(initialWorkshop);
  const [workshopGeneratedAt, setWorkshopGeneratedAt] = useState<string | null>(initialGeneratedAt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWorkshop = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/sprint-drafts/${sprintId}/workshop`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate workshop");
      }

      setWorkshopAgenda(data.workshop);
      setWorkshopGeneratedAt(new Date().toISOString());
      
      // Reload page to reflect status change
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate workshop");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteWorkshop = async () => {
    if (!confirm("Are you sure you want to remove this workshop? You can regenerate it afterwards.")) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/sprint-drafts/${sprintId}/workshop`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete workshop");
      }

      setWorkshopAgenda(null);
      setWorkshopGeneratedAt(null);
      
      // Reload page to reflect status change
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workshop");
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerateWorkshop = isAdmin && (sprintStatus === "draft" || sprintStatus === "studio_review");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sprint Kickoff Workshop</h2>
        {canGenerateWorkshop && !workshopAgenda && (
          <button
            onClick={handleGenerateWorkshop}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Workshop...
              </>
            ) : (
              <>
                <span className="text-lg">🎯</span>
                Create Workshop
              </>
            )}
          </button>
        )}
        {isAdmin && workshopAgenda && (
          <button
            onClick={handleDeleteWorkshop}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            Remove Workshop
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!workshopAgenda && !canGenerateWorkshop && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Workshop Not Yet Created</h3>
          <p className="text-sm opacity-70">
            The studio will create a custom workshop tailored to your sprint deliverables.
          </p>
        </div>
      )}

      {workshopAgenda && (
        <div className="space-y-6">
          {/* Workshop Header */}
          <div className="rounded-lg border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-xl font-bold">{workshopAgenda.title || "Sprint Kickoff Workshop"}</h3>
                </div>
                {workshopAgenda.duration && (
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>{workshopAgenda.duration} minutes</span>
                  </div>
                )}
                {workshopGeneratedAt && (
                  <div className="text-xs opacity-60 mt-2">
                    Generated: {new Date(workshopGeneratedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {workshopAgenda.objectives && workshopAgenda.objectives.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-70">Objectives</h4>
                <ul className="space-y-1">
                  {workshopAgenda.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Client Preparation Checklist */}
          {workshopAgenda.clientPreparation && (
            <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✅</span>
                <h4 className="text-lg font-bold">Client Preparation Checklist</h4>
              </div>

              <div className="space-y-4">
                {workshopAgenda.clientPreparation.beforeWorkshop && workshopAgenda.clientPreparation.beforeWorkshop.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Before the Workshop:</h5>
                    <ul className="space-y-1.5">
                      {workshopAgenda.clientPreparation.beforeWorkshop.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <input type="checkbox" className="mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {workshopAgenda.clientPreparation.toBring && workshopAgenda.clientPreparation.toBring.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">To Bring:</h5>
                    <ul className="space-y-1.5">
                      {workshopAgenda.clientPreparation.toBring.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <input type="checkbox" className="mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {workshopAgenda.clientPreparation.attendees && workshopAgenda.clientPreparation.attendees.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Who Should Attend:</h5>
                    <ul className="space-y-1.5">
                      {workshopAgenda.clientPreparation.attendees.map((attendee, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">👤</span>
                          <span>{attendee}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {workshopAgenda.clientPreparation.timeCommitment && (
                  <div className="pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm"><strong>Time Commitment:</strong> {workshopAgenda.clientPreparation.timeCommitment}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workshop Agenda */}
          {workshopAgenda.agenda && workshopAgenda.agenda.length > 0 && (
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
              <h4 className="text-lg font-bold mb-4">Workshop Agenda</h4>
              <div className="space-y-4">
                {workshopAgenda.agenda.map((item, i) => (
                  <div key={i} className="border-l-4 border-purple-400 pl-4 py-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h5 className="font-semibold">{item.section}</h5>
                        {item.description && (
                          <p className="text-sm opacity-70 mt-1">{item.description}</p>
                        )}
                        {item.activities && item.activities.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {item.activities.map((activity, j) => (
                              <li key={j} className="text-sm flex items-start gap-2">
                                <span className="opacity-50">→</span>
                                <span>{activity}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {item.output && (
                          <div className="mt-2 text-sm">
                            <strong className="opacity-70">Output:</strong> {item.output}
                          </div>
                        )}
                      </div>
                      {item.duration && (
                        <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {item.duration} min
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workshop Exercises */}
          {workshopAgenda.exercises && workshopAgenda.exercises.length > 0 && (
            <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 p-6">
              <h4 className="text-lg font-bold mb-4">Proven Workshop Exercises</h4>
              <div className="space-y-6">
                {workshopAgenda.exercises.map((exercise, i) => (
                  <div key={i} className="space-y-2">
                    <div>
                      <h5 className="font-semibold text-base">{exercise.name}</h5>
                      {exercise.source && (
                        <p className="text-xs opacity-60">Source: {exercise.source}</p>
                      )}
                    </div>
                    {exercise.purpose && (
                      <p className="text-sm"><strong>Purpose:</strong> {exercise.purpose}</p>
                    )}
                    {exercise.bestFor && (
                      <p className="text-sm"><strong>Best For:</strong> {exercise.bestFor}</p>
                    )}
                    {exercise.timing && (
                      <p className="text-sm"><strong>Timing:</strong> {exercise.timing}</p>
                    )}
                    {exercise.howToRun && exercise.howToRun.length > 0 && (
                      <div className="text-sm">
                        <strong>How to Run:</strong>
                        <ol className="list-decimal list-inside space-y-1 mt-1">
                          {exercise.howToRun.map((step, j) => (
                            <li key={j}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Outcomes */}
          {workshopAgenda.expectedOutcomes && workshopAgenda.expectedOutcomes.length > 0 && (
            <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 p-6">
              <h4 className="text-lg font-bold mb-3">Expected Outcomes</h4>
              <ul className="space-y-2">
                {workshopAgenda.expectedOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">⭐</span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {workshopAgenda.nextSteps && workshopAgenda.nextSteps.length > 0 && (
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
              <h4 className="text-lg font-bold mb-3">Next Steps After Workshop</h4>
              <ul className="space-y-2">
                {workshopAgenda.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="opacity-50">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {workshopAgenda.notes && workshopAgenda.notes.length > 0 && (
            <div className="text-sm opacity-70 space-y-1">
              <h4 className="font-semibold">Notes:</h4>
              <ul className="space-y-1">
                {workshopAgenda.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

