# User Journey Modal Data Mapping Fix

## Summary
Fixed the user modal on the user journey pages to correctly display data from the PERSONAS array, which uses the JTBD (Jobs To Be Done) framework schema.

## Problem
The modal was trying to access fields that didn't exist in the personas data structure:
- Looking for `persona.goals` but data has `persona.mustHaveOutcomes`
- Looking for `persona.painPoints` but data has `persona.trustFairnessRules`
- Looking for `persona.behaviors` but data has `persona.triggerMoments`
- Looking for `persona.quote` but data has `persona.coreJob`
- Looking for `persona.tags` but data has `persona.successLooksLike`
- Looking for `persona.journeyStages` but data has `persona.defaultVisibility`

## Files Changed

### 1. sandboxes-data/styleguide/journey-scripts.js
**Function: `openUserModal(personaIndex)`**

Updated data mapping to correctly extract from persona object:

```javascript
// OLD (incorrect)
const role = persona.roleRelationship?.role || persona.role || '';
const painPoints = persona.trustFairness?.breaksTrust || persona.painPoints || [];
const behaviors = persona.triggersJobs?.jobsToBeDone || persona.behaviors || [];

// NEW (correct)
const role = persona.role || '';
const relationship = persona.relationship || '';
const roleDisplay = relationship ? `${role} — ${relationship}` : role;

const quote = persona.coreJob || '';
const goals = persona.mustHaveOutcomes?.map(outcome => 
  outcome.description ? `${outcome.label}: ${outcome.description}` : outcome.label
) || [];
const painPoints = persona.trustFairnessRules || [];
const behaviors = persona.triggerMoments || [];
const tags = persona.successLooksLike || [];

const visibilityInfo = [];
if (persona.defaultVisibility?.sees) {
  visibilityInfo.push(`Sees: ${persona.defaultVisibility.sees}`);
}
if (persona.defaultVisibility?.doesNotSee) {
  visibilityInfo.push(`Does not see: ${persona.defaultVisibility.doesNotSee}`);
}
```

**Function: CSV Export**

Updated the CSV export to match the correct data structure.

### 2. sandboxes-data/styleguide/user-journey-first-trip.html

**Modal Section Labels Updated:**
- "Goals" → "Must-Have Outcomes"
- "Pain Points" → "Trust & Fairness Rules"  
- "Jobs to be Done" → "Trigger Moments"
- "Key Journey Stages:" → "Default Visibility:"

**Modal Section Icons Updated:**
- Pain Points icon changed from 😤 to 🔒
- Jobs to be Done icon changed from 🔄 to ⚡

**Success Tags Styling:**
- Added label "What Success Looks Like:" above tags
- Updated tag colors to use success colors (green) instead of neutral gray

## Persona Data Schema
The personas follow this JTBD framework structure:

```javascript
{
  name: "The Driving Parent",
  emoji: "👨‍👧",
  avatar: "./images/scene-01.jpg",
  role: "Account Owner (Admin)",
  relationship: "Parent/guardian of a new teen driver",
  coreJob: "When my teen is driving independently, I want...",  // Used as quote
  triggerMoments: [],        // Why they open the app
  mustHaveOutcomes: [],      // Non-negotiables with label + description
  trustFairnessRules: [],    // What can't be violated
  defaultVisibility: {       // What they see/don't see
    sees: "...",
    doesNotSee: "..."
  },
  successLooksLike: []       // Success metrics (shown as tags)
}
```

## Testing
You can test the data mapping by:
1. Opening http://localhost:8080/user-journey-first-trip.html
2. Clicking on any user chip in the journey stages
3. Verifying all sections show correct data:
   - Header shows role + relationship
   - Quote shows coreJob statement
   - Tags show successLooksLike items in green
   - Must-Have Outcomes section shows formatted outcomes
   - Trust & Fairness Rules shows rules
   - Trigger Moments shows when they open the app
   - Footer shows default visibility settings

Or use the test page:
http://localhost:8080/test-modal.html

## Result
✅ Modal now correctly displays all persona data
✅ Section labels match the JTBD framework terminology
✅ CSV export includes correct data fields
✅ Visual styling updated to match semantic meaning (success tags in green, etc.)
