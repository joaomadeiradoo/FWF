# FWF 2.0 - Complete Overhaul Implementation Plan

## Current Status
✅ Login RESTORED and working
✅ All features from previous session working
⏳ Ready for major overhaul

---

## Your Requirements (No Compromises)

### 1. **Automatic Score Application**
**What you want:**
- API fetches scores continuously (already doing this ✅)
- Scores automatically apply to actualScores in Firestore
- No confirmation needed
- Host can manually override if API is wrong

**Implementation:**
```javascript
// In fetchUpcoming() - after fetching recent finished matches:
recentData = [{home:'Portugal',away:'France',hs:2,as:1}, ...]

// NEW: Auto-apply to Firestore
for(const match of recentData){
  const found = ALL_MATCHES.find(m => 
    matchTeamNames(m.home, match.home) && 
    matchTeamNames(m.away, match.away)
  );
  if(found && !actualScores[found.id]){
    actualScores[found.id] = {home:match.hs, away:match.as, source:'api'};
    await updateFirestore();
  }
}
```

**Challenges:**
- Team name matching (API uses "Portugal", we might use "Portugal" or "🇵🇹 Portugal")
- Overwrite protection (don't overwrite manual entries)
- Need "source" field to track api vs manual

**Estimated effort:** 2 hours
**Risk:** Medium (team name matching could fail)

---

### 2. **Simplified Auth (Name + PIN + Code)**

**What you want:**
- No emails, no passwords
- User enters: Name + 4-digit PIN + Invite Code
- First time: Creates account with that combo
- Next time: Same name+PIN logs them in
- Multiple competitions possible (each with own code)

**Implementation Strategy:**

#### A. Data Structure
```javascript
// Firestore structure:
competitions/{comp_id}/
  inviteCode: "ABC123"
  name: "World Cup 2026"
  members: {
    "uid_123": {
      name: "João",
      pinHash: "hashed_pin", // bcrypt or similar
      role: "host",
      joinedAt: "2026-05-12..."
    }
  }
  predictions: {...}
  actualScores: {...}
```

#### B. Auth Flow
```
User enters: Name="João" + PIN="1234" + Code="ABC123"

1. Find competition with inviteCode="ABC123"
2. Check if any member has name="João" AND pinHash matches "1234"
3. If YES → Sign in with that UID (Firebase Anonymous Auth)
4. If NO → Create new Firebase Anonymous user, add to members
5. Store UID in localStorage for auto-login
```

#### C. Multiple Competitions
```
// Host creates new competition:
- Generates new invite code
- Creates new competition doc
- Host is member of multiple competitions
- UI shows dropdown to switch between competitions

// User interface:
Screen 1: Name + PIN + Code → Joins competition
Screen 2: (After login) Shows competition selector if user is in multiple
```

**Changes Required:**
- Remove email/password auth completely
- Replace with Firebase Anonymous Auth
- Add PIN hashing (bcrypt.js or similar)
- Add competition switcher UI
- LocalStorage for auto-login
- Migration path for existing users (?)

**Estimated effort:** 6-8 hours
**Risk:** HIGH (complete auth overhaul, data migration needed)

---

### 3. **Clear Existing Competitions**

**What you want:**
- Fresh Firebase database
- No old test data
- Clean slate for testing

**Implementation:**
```
Option A: Manual deletion via Firebase Console
Option B: Script to delete all competition docs
Option C: Create new Firebase project entirely
```

**Recommendation:** Option A (Manual) - safest, you control what gets deleted

**Estimated effort:** 10 minutes manual
**Risk:** LOW (but irreversible)

---

## Implementation Order (Recommended)

### Phase 1: Automatic Scores (2 hours)
1. Add team name normalization function
2. Auto-apply API scores to actualScores
3. Add 'source' field (api/manual)
4. Prevent overwriting manual scores
5. Test with mock data
6. Deploy and monitor

**Deliverable:** Scores auto-update, host can still override

---

### Phase 2: Data Cleanup (10 min)
1. You manually delete old competitions in Firebase Console
2. Keep structure, just delete documents
3. Verify empty state

**Deliverable:** Clean database ready for new auth

---

### Phase 3: New Auth System (6-8 hours)
1. Create new auth flow (Name + PIN + Code)
2. Implement PIN hashing
3. Update Firebase rules for anonymous auth
4. Add competition selector UI
5. Add "Create Competition" for hosts
6. Remove old email/password code
7. Test thoroughly
8. Deploy

**Deliverable:** Simple Name+PIN+Code auth, multiple competitions

---

## CRITICAL QUESTION FOR YOU

**Auth Migration:**
Do you want to:

A) **Clean break** - Delete everything, start fresh with new auth
   - Pros: Clean, simple
   - Cons: You lose your existing account, need to re-enter all data
   
B) **Migration path** - Keep your existing email/password for host, new users use PIN
   - Pros: You keep your data
   - Cons: Two auth systems running (messy)
   
C) **Hybrid** - You manually re-create your competition under new auth
   - Pros: Clean system, you control timing
   - Cons: Manual work

**My recommendation:** Option C
- I implement new auth
- I deploy to a TEST url first
- You test it thoroughly
- When ready, you manually delete old comp and create new one
- Clean system, controlled migration

---

## Testing Strategy

### For Automatic Scores:
1. Mock API responses with test data
2. Verify auto-application
3. Verify manual override works
4. Check that manual entries don't get overwritten

### For New Auth:
1. Test account creation (first time)
2. Test login (returning user)
3. Test wrong PIN
4. Test invalid code
5. Test multiple users same competition
6. Test multiple competitions same user
7. Test competition switching

---

## Estimated Total Time

- **Automatic scores:** 2-3 hours
- **New auth system:** 6-8 hours
- **Testing:** 2-3 hours
- **Deployment & fixes:** 1-2 hours

**Total:** 11-16 hours of focused development

---

## What I Need From You

1. **Confirm approach** - Do you agree with this plan?
2. **Auth migration decision** - A, B, or C above?
3. **Priority** - Which first? (I recommend: Auto-scores → Clean DB → New auth)
4. **Testing window** - Can you test immediately after each phase?
5. **Firebase access** - Do you want to clear the DB yourself or should I write a script?

---

## My Recommendation

**Let's do this in 3 sessions:**

**Session 1 (NOW - 2 hours):**
- Implement automatic score application
- Test and deploy
- You verify it works

**Session 2 (After your testing - 1 hour):**
- You clear Firebase DB manually
- I verify clean state

**Session 3 (Dedicated time - 8 hours):**
- Complete auth overhaul
- Deploy to TEST environment first
- You test thoroughly
- Deploy to production when ready

This way:
- No rushed mistakes
- Each change is tested
- You maintain control
- We can rollback if needed

---

## Alternative: All at Once (HIGH RISK)

If you want everything NOW:
- I'll implement all 3 changes
- ~12-16 hours of work
- Higher risk of bugs
- Harder to debug if something breaks
- But you get everything today

**Your call. What do you prefer?**
