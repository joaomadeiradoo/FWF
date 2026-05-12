# Firebase Cleanup Script

This script helps you clear existing competition data to start fresh.

## Option 1: Manual Cleanup (RECOMMENDED)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `fwf1-3b522`
3. Go to Firestore Database
4. Delete collections:
   - `competitions` - DELETE ALL DOCUMENTS
   - `users` - DELETE ALL DOCUMENTS (optional, but recommended)
   - `apiUsage` - DELETE ALL DOCUMENTS (optional, resets API counter)

## Option 2: Automated Script

Run this in Firebase Console → Firestore → Rules → "Run in Console":

```javascript
// WARNING: This deletes ALL competitions permanently!
const db = firebase.firestore();

async function clearAllCompetitions() {
  const snap = await db.collection('competitions').get();
  const batch = db.batch();
  
  snap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Deleted ${snap.size} competitions`);
}

async function clearAllUsers() {
  const snap = await db.collection('users').get();
  const batch = db.batch();
  
  snap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Deleted ${snap.size} users`);
}

// Run these:
await clearAllCompetitions();
await clearAllUsers();
console.log('✅ Database cleared!');
```

## After Cleanup

1. Create your first competition:
   - Go to: https://joaomadeiradoo.github.io/FWF/
   - Click "🎯 Criar Nova Competição"
   - Enter your name + 4-digit PIN
   - Enter competition name (e.g., "World Cup 2026")
   - Click "Criar / Create"
   - You'll get an invite code

2. Share the code with friends:
   - They enter: Name + PIN + Your Code
   - They join instantly

## Testing the New System

### Test 1: Create Competition
- Name: "Test Host"
- PIN: "1234"
- Competition: "Test World Cup"
- Expected: Competition created, code shown

### Test 2: Join Competition
- Name: "Test User"
- PIN: "5678"
- Code: [from step 1]
- Expected: Join successful

### Test 3: Return User
- Name: "Test User"
- PIN: "5678"
- Code: [same code]
- Expected: Auto-login

### Test 4: Wrong PIN
- Name: "Test User"
- PIN: "9999"
- Code: [same code]
- Expected: Creates NEW user (different PIN = different person)

### Test 5: Manual Scores
- Host logs in
- Goes to Host Panel
- Enters scores manually
- Saves
- Expected: Scores save with source='manual'

### Test 6: API Auto-Scores
- Wait for API to fetch finished matches
- Check Host Panel → scores auto-filled
- Expected: Scores with source='api' can be overridden

## Troubleshooting

### "Código inválido"
- Double-check the code (case-sensitive)
- Make sure competition exists in Firestore

### "PIN deve ter 4 dígitos"
- PIN must be exactly 4 numbers (0-9)

### Can't login
- Clear localStorage: Open DevTools → Application → Local Storage → Clear
- Try creating new competition

### Scores not auto-applying
- Check Host Panel → API counter
- Make sure you're admin/host
- Check browser console for errors

## Firebase Security Rules

Make sure your Firestore rules allow anonymous auth:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

After cleanup and testing:
1. Create your REAL competition
2. Share code with friends
3. Start making predictions
4. Monitor API auto-scores
5. Override if needed

---

**⚠️ WARNING: Cleanup is IRREVERSIBLE. Back up any data you want to keep!**
