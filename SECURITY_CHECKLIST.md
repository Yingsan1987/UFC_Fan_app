# 🔒 Security Checklist - CRITICAL

## ⚠️ NEVER COMMIT THESE FILES TO GIT

Your `.gitignore` files have been configured to protect sensitive information. Make sure these files are **NEVER** committed to your repository:

### Backend Files (🔴 CRITICAL)
- ✅ `backend/.env` - Contains:
  - Stripe secret keys
  - MongoDB connection string
  - Firebase service account JSON
- ✅ `backend/serviceAccountKey.json` - Firebase service account (if downloaded)
- ✅ `backend/*-firebase-adminsdk-*.json` - Any Firebase admin SDK files

### Frontend Files (🟡 IMPORTANT)
- ✅ `frontend/.env` - Contains:
  - Firebase API keys
  - Firebase project configuration
  - API endpoints

## ✅ What IS Safe to Commit

These files are okay to commit:
- ✅ `.env.example` - Template files without actual values
- ✅ `FIREBASE_SETUP.md` - Setup instructions
- ✅ `AUTHENTICATION_GUIDE.md` - Documentation
- ✅ All source code files

## 🔍 How to Check Before Committing

Run this command before every commit:

```bash
git status
```

**If you see any of these files listed, DO NOT COMMIT:**
- `.env`
- `serviceAccountKey.json`
- `firebase-adminsdk-*.json`

## 🚨 If You Accidentally Committed Secrets

If you accidentally committed sensitive files:

1. **Immediately rotate ALL credentials:**
   - Regenerate Firebase service account key
   - Regenerate Stripe API keys
   - Change MongoDB password
   - Update all environment variables

2. **Remove from Git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (DANGEROUS - coordinate with team):**
   ```bash
   git push origin --force --all
   ```

## 📋 Current Protection Status

### Root `.gitignore`
- ✅ All `.env` files in backend and frontend
- ✅ All Firebase service account JSON files
- ✅ Node modules and build files

### Backend `.gitignore`
- ✅ `.env` and variants
- ✅ `serviceAccountKey.json`
- ✅ All Firebase admin SDK files

### Frontend `.gitignore`
- ✅ `.env` and variants
- ✅ Firebase config files

## 🛡️ Best Practices

1. **Use Environment Variables**
   - Store ALL secrets in `.env` files
   - Never hardcode API keys in source code

2. **Use .env.example Templates**
   - Create `.env.example` with placeholder values
   - Commit the template, not the actual `.env`

3. **Regular Security Audits**
   - Check your repository for exposed secrets
   - Use tools like `git-secrets` or `truffleHog`

4. **Separate Dev and Prod Credentials**
   - Use different Firebase projects for dev/prod
   - Use different Stripe accounts (test mode vs live mode)

5. **Review Pull Requests**
   - Always review changes before merging
   - Look for accidentally committed secrets

## 🔗 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Remember**: Once a secret is committed to Git, consider it compromised. Always rotate credentials if you're unsure!


