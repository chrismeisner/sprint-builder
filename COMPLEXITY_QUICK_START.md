# Complexity Score Quick Start

## What Is It?

A system to adjust deliverable pricing based on project complexity while maintaining fixed base prices.

**Simple formula**: `adjusted_price = base_price × (complexity / 2.5)`

## Quick Reference

| Score | Label | Multiplier | Use When |
|-------|-------|------------|----------|
| 1.0 | Very Simple | 40% | Minimal work, template-based |
| 1.5 | Simpler | 60% | Below average effort |
| 2.0 | Below Average | 80% | Less complex than typical |
| **2.5** | **Standard** | **100%** | **Default - typical project** |
| 3.0 | Above Average | 120% | Slightly more complex |
| 3.5 | More Complex | 140% | Requires extra work |
| 4.0 | Complex | 160% | Significantly more effort |
| 4.5 | Very Complex | 180% | Extensive requirements |
| 5.0 | Extremely Complex | 200% | Maximum complexity |

## Real Examples

### Logo Design

**Base**: 8h, $1,200

| Client Request | Complexity | Hours | Price |
|----------------|-----------|-------|-------|
| "Just our name in Helvetica" | 1.5 | 4.8h | $720 |
| Standard custom wordmark | 2.5 | 8h | $1,200 |
| Custom ligatures + multi-language | 4.0 | 12.8h | $1,920 |

### Prototype

**Base**: 20h, $3,000

| Client Request | Complexity | Hours | Price |
|----------------|-----------|-------|-------|
| Simple 3-screen click-through | 1.5 | 12h | $1,800 |
| Standard 5-7 screen prototype | 2.5 | 20h | $3,000 |
| 10 screens + animations + data | 4.5 | 36h | $5,400 |

## How to Use (3 Steps)

### Step 1: Create/Edit Package
Navigate to `/dashboard/sprint-packages/new`

### Step 2: Set Complexity
For each deliverable, set complexity (1-5, default 2.5)

### Step 3: Save
Package pricing auto-calculates with complexity adjustments

## Decision Guide

### Use 1.0 - 2.0 (Simpler) When:
- ✅ Client has very simple requirements
- ✅ Template-based approach works
- ✅ Client provides ready assets
- ✅ Minimal customization needed

### Use 2.5 (Standard) When:
- ✅ Typical project (DEFAULT)
- ✅ Standard scope for deliverable
- ✅ When unsure
- ✅ Average complexity

### Use 3.0 - 5.0 (Complex) When:
- ✅ Extensive requirements
- ✅ Multiple stakeholders
- ✅ Custom technical work
- ✅ Tight integrations needed
- ✅ Many revisions expected

## Default: Always 2.5

**When in doubt, use 2.5 (standard).** Only adjust when requirements clearly differ from typical.

## Where It Shows Up

### Admin Dashboard
- `/dashboard/sprint-packages/new` - Set complexity per deliverable
- Real-time adjusted pricing display
- Shows base value → adjusted value

### Client Pages
- `/packages` - Auto-calculated pricing
- `/packages/[slug]` - Shows adjusted values
- Transparent: shows base when adjusted

## Common Scenarios

### Scenario 1: Simple Client
**Intake**: "We just need something basic and clean"
→ Set complexity to **1.5-2.0** on execution deliverables

### Scenario 2: Standard Client
**Intake**: "We want a professional [deliverable]"
→ Keep complexity at **2.5** (default)

### Scenario 3: Complex Client
**Intake**: "We have very specific requirements and need multiple iterations"
→ Set complexity to **3.5-4.5** on affected deliverables

### Scenario 4: Mixed Package
**Workshop**: Always **2.5** (standard)  
**Logo**: Simple → **1.5**  
**Style Guide**: Complex → **3.5**  
**Result**: Balanced pricing

## Calculator

**Quick math**: `base × (score / 2.5)`

| Base | @1.0 | @1.5 | @2.5 | @3.5 | @5.0 |
|------|------|------|------|------|------|
| $1,000 | $400 | $600 | $1,000 | $1,400 | $2,000 |
| $1,500 | $600 | $900 | $1,500 | $2,100 | $3,000 |
| $2,000 | $800 | $1,200 | $2,000 | $2,800 | $4,000 |
| $3,000 | $1,200 | $1,800 | $3,000 | $4,200 | $6,000 |

## Best Practices

1. **Start with 2.5** - Default to standard
2. **Adjust based on discovery** - Use intake insights
3. **Be consistent** - Similar projects = similar scores
4. **Document reasoning** - Note why you chose a score
5. **Communicate value** - Explain to clients when adjusted

## FAQs

**Q: Can I use decimals like 2.3 or 3.7?**  
A: Yes! The system accepts values in 0.1 increments, but we recommend 0.5 increments for simplicity.

**Q: What if a client wants to negotiate?**  
A: Adjust complexity score to match agreed pricing. The system is flexible.

**Q: Should workshops have complexity adjustments?**  
A: Usually no. Workshops are typically 2.5 (standard).

**Q: Can complexity change after the package is created?**  
A: Yes, edit the package at `/dashboard/sprint-packages/[id]/edit`.

**Q: What happens to existing packages?**  
A: All existing packages default to 2.5 (no price change).

**Q: Do clients see the complexity score?**  
A: They see adjusted pricing, and if complexity ≠ 2.5, we show it's been adjusted.

## Testing It Out

1. **Seed sample packages**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/sprint-packages/seed
   ```

2. **Edit a package**:
   - Go to `/dashboard/sprint-packages`
   - Edit "Brand Identity Sprint"
   - Change logo complexity from 2.5 to 1.5
   - See price drop from $1,200 to $720

3. **Create custom package**:
   - Go to `/dashboard/sprint-packages/new`
   - Add deliverables with varied complexity
   - Watch totals update in real-time

## Summary

✅ Complexity scores adjust pricing per deliverable  
✅ Range: 1.0 (simple) to 5.0 (complex)  
✅ Default: 2.5 (standard - 100% of base)  
✅ Set in admin dashboard  
✅ Auto-calculates on client pages  
✅ Maintains fixed base pricing model  

**Remember**: When in doubt, use 2.5!

---

For complete details, see `COMPLEXITY_SCORE_SYSTEM.md`

