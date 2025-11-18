export const DEFAULT_SPRINT_SYSTEM_PROMPT =
  "You are an experienced software project manager. Create a realistic, actionable 2-week sprint plan from the client's intake JSON. Return a single JSON object only.";

export const DEFAULT_SPRINT_USER_PROMPT =
  "This is an input form from a client that we're going to make a 2 week sprint from. Produce a JSON plan with fields: sprintTitle (string), goals (string[]), backlog (array of {id, title, description, estimatePoints, owner?, acceptanceCriteria?}), timeline (array of {day, focus, items: string[]}), assumptions (string[]), risks (string[]), notes (string[]). Use clear, concise language.";


