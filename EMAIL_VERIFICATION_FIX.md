# Email Verification Fix Guide

## 🔧 **Supabase Dashboard Settings**

### 1. **Authentication Settings**
Go to Supabase Dashboard → **Authentication** → **Settings**

**Enable these options:**
- ✅ **Enable email confirmations**
- ✅ **Enable signup** 
- ✅ **Enable manual linking**

### 2. **Site URL Configuration**
In **Site URL** field, add:
```
http://localhost:3000
```

In **Redirect URLs** field, add:
```
http://localhost:3000/auth/callback
http://localhost:3000/**
```

### 3. **Email Templates**
Go to **Authentication** → **Email Templates**

**Confirm signup template** should have:
- **Subject**: `Confirm your signup`
- **Body**: Should contain `{{ .ConfirmationURL }}`

## 🛠️ **Code Fixes**

### 1. **Update Signup Function**
The signup should handle both confirmed and unconfirmed users properly.

### 2. **Add Email Confirmation Handler**
Create a route to handle email confirmations.

## 🧪 **Testing Steps**

1. **Clear browser data** (cookies, localStorage)
2. **Try signup with a real email**
3. **Check spam folder** for verification email
4. **Click the verification link**
5. **Should redirect to dashboard**

## 🚨 **Common Issues**

### **No Email Received**
- Check Supabase email quota (30/hour free)
- Verify email address is correct
- Check spam/junk folder
- Try different email provider

### **Email Link Doesn't Work**
- Check Site URL matches exactly
- Verify redirect URLs include callback
- Clear browser cache
- Try incognito mode

### **"Invalid Link" Error**
- Link may have expired (1 hour default)
- User may already be confirmed
- Check for typos in redirect URLs

## 🔄 **Alternative: Skip Email Verification (Development)**

For development only, you can disable email confirmation:

1. Supabase Dashboard → **Authentication** → **Settings**
2. **Disable** "Enable email confirmations"
3. Users will be auto-confirmed on signup

⚠️ **Don't use this in production!** 