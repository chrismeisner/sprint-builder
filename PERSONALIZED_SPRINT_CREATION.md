# Personalized Sprint Creation from Typeform Data

## Overview

The sprint creation system now extracts and utilizes specific fields from Typeform submissions to create highly personalized sprint drafts. Instead of just dumping raw JSON to the AI, we now parse key information and present it in a structured, highlighted way.

## What Data We Extract

From the Typeform submission, we extract:

### Client Information
- **Project Name**: "What's the name of your startup or project?"
- **First Name**: Client's first name
- **Last Name**: Client's last name
- **Email**: Contact email

### Project Details
- **Project Description**: "In one sentence, what are you building?"
- **Current Stage**: "Idea phase", "Early prototype", "MVP live", etc.
- **Team Size**: "Just me", "2–5 people", etc.

### Requirements & Context
- **Roles**: Client's role(s) - "Founder", "Product", "Design", "Engineering", "Marketing"
- **Help Needed**: "Product or prototype support", "Branding", etc.
- **Existing Designs**: Status of current designs/UX
- **Priority Deliverables**: Which deliverables matter most
- **Main Use Case**: "User testing", "Investor demo", etc.
- **Timeline**: "ASAP - next week", "Within 2-3 weeks", etc.

## How We Use This Data

### 1. Enhanced AI Prompt

**Before** (just raw JSON):
```
Client intake JSON:

{
  "event_id": "01KAGZWASZ16R71HX53YTDYR77",
  "event_type": "form_response",
  "form_response": {
    ... 300 lines of nested JSON ...
  }
}
```

**After** (structured context + JSON):
```
=== CLIENT CONTEXT ===

PROJECT NAME: SubSender
CLIENT: Chris Meisner
WHAT THEY'RE BUILDING: a simple way for people to create a subscriptions with Stripe and charge for recurring group Zoom meetings, and create the recurring meetings and invite active subscribers
CURRENT STAGE: Early prototype
CLIENT'S ROLE(S): Founder / Co-founder, Product, Engineering, Design, Marketing
TEAM SIZE: Just me
PRIMARY NEED: Product or prototype support
EXISTING DESIGNS: Yes — but they're rough or need improvement.
PRIORITY DELIVERABLES: ⚙️ Build a clickable prototype, 🙂 Define our Ideal Customer Profile, 🥾 Map our user journey
MAIN USE CASE: User testing
TIMELINE: Within 2–3 weeks

=== END CONTEXT ===

Full client intake data (Typeform JSON):
{
  ... complete JSON for reference ...
}
```

### 2. Personalized Sprint Title

**Before**: Generic title
```
"Sprint Draft"
```

**After**: Personalized with project name
```
"Sprint Plan for SubSender"
```

Or if no project name:
```
"Sprint Plan for Chris Meisner"
```

### 3. Personalized Email Notification

**Before**: Generic greeting
```
Subject: Your Sprint Plan is Ready: Sprint Draft

Hi there,

Great news - we've analyzed your project requirements...
```

**After**: Personalized with client name and project
```
Subject: Your Sprint Plan is Ready: Sprint Plan for SubSender

Hi Chris!

Great news - we've analyzed your project requirements and created a 
custom 2-week sprint plan just for you for SubSender.
```

## Real Example

### Typeform Submission
```json
{
  "form_response": {
    "answers": [
      {
        "text": "SubSender",
        "field": { "title": "What's the name of your startup or project?" }
      },
      {
        "text": "Chris",
        "field": { "title": "First name" }
      },
      {
        "text": "Meisner",
        "field": { "title": "Last name" }
      },
      {
        "email": "chris@chrismeisner.com",
        "field": { "title": "Email" }
      },
      {
        "text": "a simple way for people to create subscriptions with Stripe...",
        "field": { "title": "In one sentence, what are you building?" }
      },
      {
        "choice": { "label": "Early prototype" },
        "field": { "title": "How would you describe your current stage?" }
      }
    ]
  }
}
```

### Extracted Client Data
```typescript
{
  projectName: "SubSender",
  firstName: "Chris",
  lastName: "Meisner",
  fullName: "Chris Meisner",
  email: "chris@chrismeisner.com",
  projectDescription: "a simple way for people to create subscriptions with Stripe...",
  currentStage: "Early prototype",
  roles: ["Founder / Co-founder", "Product", "Engineering", "Design", "Marketing"],
  teamSize: "Just me",
  helpNeeded: "Product or prototype support",
  existingDesigns: "Yes — but they're rough or need improvement.",
  deliverablesPriority: [
    "⚙️ Build a clickable prototype",
    "🙂 Define our Ideal Customer Profile",
    "🥾 Map our user journey"
  ],
  mainUseCase: ["User testing"],
  timeline: "Within 2–3 weeks"
}
```

### AI Receives This Context
```
=== SPRINT PACKAGES & DELIVERABLES ===
[... catalog of available packages and deliverables ...]

=== CLIENT CONTEXT ===

PROJECT NAME: SubSender
CLIENT: Chris Meisner
WHAT THEY'RE BUILDING: a simple way for people to create subscriptions with Stripe and charge for recurring group Zoom meetings, and create the recurring meetings and invite active subscribers
CURRENT STAGE: Early prototype
CLIENT'S ROLE(S): Founder / Co-founder, Product, Engineering, Design, Marketing
TEAM SIZE: Just me
PRIMARY NEED: Product or prototype support
EXISTING DESIGNS: Yes — but they're rough or need improvement.
PRIORITY DELIVERABLES: ⚙️ Build a clickable prototype, 🙂 Define our Ideal Customer Profile, 🥾 Map our user journey
MAIN USE CASE: User testing
TIMELINE: Within 2–3 weeks

=== END CONTEXT ===
```

### Result: AI Can Now...

1. **Reference the project by name** in the sprint draft:
   - "For SubSender, we recommend..."
   - "Your Stripe + Zoom integration..."

2. **Tailor recommendations to stage**:
   - Knows it's an "Early prototype", not "Idea phase" or "MVP live"
   - Can suggest appropriate next steps

3. **Respect priorities**:
   - Sees "Build a clickable prototype" is top priority
   - Knows "User testing" is the main use case

4. **Match timeline**:
   - Understands "Within 2-3 weeks" urgency
   - Can scope recommendations appropriately

5. **Understand context**:
   - Solo founder wearing multiple hats
   - Has rough designs that need improvement
   - Needs product/prototype support

## Benefits

### For Users
- ✅ **Personal touch**: Email says "Hi Chris!" not "Hi there,"
- ✅ **Relevant content**: AI knows what they're building and can reference it
- ✅ **Better recommendations**: AI sees priorities and tailors suggestions
- ✅ **Professional title**: "Sprint Plan for SubSender" not "Sprint Draft"

### For AI Quality
- ✅ **Structured input**: Key information is highlighted, not buried in JSON
- ✅ **Better context**: AI doesn't have to parse nested JSON structures
- ✅ **Clear priorities**: Important fields are surfaced at the top
- ✅ **Improved accuracy**: AI can better match deliverables to needs

### For Developers
- ✅ **Type-safe**: Extracted data has proper TypeScript types
- ✅ **Reusable**: Can use client data throughout the system
- ✅ **Maintainable**: Single extraction function, easy to update
- ✅ **Debuggable**: Logs show extracted data for troubleshooting

## Implementation Details

### Extraction Function
```typescript
function extractClientDataFromTypeform(content: unknown): ClientData {
  // Parses Typeform JSON and extracts key fields
  // Uses field titles to identify the right answers
  // Returns structured ClientData object
}
```

### Usage in Sprint Creation
```typescript
// 1. Extract client data
const clientData = extractClientDataFromTypeform(document.content);

// 2. Build personalized context for AI
const contextParts = [
  `PROJECT NAME: ${clientData.projectName}`,
  `CLIENT: ${clientData.fullName}`,
  `WHAT THEY'RE BUILDING: ${clientData.projectDescription}`,
  // ... more fields
];

// 3. Add to prompt
const personalizedContext = contextParts.join("\n");
const combinedPrompt = `${userPrompt}\n\n${catalogInstructions}${personalizedContext}`;

// 4. Use in title
const title = clientData.projectName 
  ? `Sprint Plan for ${clientData.projectName}`
  : "Sprint Draft";

// 5. Use in email
const emailContent = generateSprintDraftEmail({
  sprintTitle: title,
  sprintUrl,
  clientName: clientData.firstName,
  projectName: clientData.projectName,
});
```

## Field Matching Strategy

The extraction function matches Typeform fields by looking at field titles. This is resilient to Typeform schema changes:

```typescript
// Project name
if (fieldTitle?.includes("name of your startup") || 
    fieldTitle?.includes("name of your project")) {
  result.projectName = answer.text;
}

// First name
else if (fieldTitle?.includes("first name")) {
  result.firstName = answer.text;
}

// Project description
else if (fieldTitle?.includes("what are you building")) {
  result.projectDescription = answer.text;
}
```

This approach:
- ✅ Works even if Typeform field IDs change
- ✅ Handles partial title matches
- ✅ Is case-insensitive
- ✅ Gracefully handles missing fields

## Logging & Debugging

The system logs extracted data for troubleshooting:

```
[AutoSprint] Extracted client data {
  projectName: 'SubSender',
  fullName: 'Chris Meisner',
  email: 'chris@chrismeisner.com',
  hasDescription: true
}

[AutoSprint] Email notification queued {
  to: 'chris@chrismeisner.com',
  sprintUrl: 'https://meisner.design/sprints/a1b2c3d4-...',
  clientName: 'Chris',
  projectName: 'SubSender'
}
```

## Future Enhancements

Potential improvements:
- Store `ClientData` in database for easy access
- Use project description in sprint package recommendation
- Match deliverable priorities against catalog
- Generate custom pricing based on team size
- Adjust timeline recommendations based on urgency
- Create project records automatically from client data

## Summary

🎯 **Before**: Raw JSON dump → Generic AI response → Generic email

🚀 **After**: Structured extraction → Personalized AI context → Custom email

The system now **truly understands** who the client is, what they're building, and what they need!

