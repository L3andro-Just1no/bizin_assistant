# Widget Deployment - Final Steps

## ✅ Completed Steps

1. ✅ Widget rebuilt with URL fixes (BIZINLINK placeholders)
2. ✅ Source code deployed to Vercel
3. ✅ Knowledge base updated with complete URLs (345 chars)
4. ✅ Chunks verified - all Stripe URLs are complete

## 📋 Remaining Steps (Manual)

### Step 1: Find Your Production Backend URL

1. Go to: https://vercel.com/dashboard
2. Find the project: **bizin_assistant** (or similar name from repo: L3andro-Just1no/bizin_assistant)
3. Copy the production domain (e.g., `bizin-assistant-xyz.vercel.app`)

### Step 2: Verify Widget Script Tag on External Site

The widget on `bizin-site.vercel.app` needs to load from the correct backend.

**To check:**

1. Open `https://bizin-site-p5y8sxqd7-marketing-neomarcas-projects.vercel.app` in browser
2. Right-click > "View Page Source" or press `Ctrl+U`
3. Search for `widget.js` or `BizinAgent`
4. Verify the script tag looks like this:

```html
<script 
  src="https://[YOUR-BACKEND-DOMAIN]/widget.js"
  data-bizin-auto-init
  data-api-url="https://[YOUR-BACKEND-DOMAIN]"
  data-language="pt"
  data-theme="light"
></script>
```

**Important:**
- `src` should point to your backend domain (where the API is)
- `data-api-url` should point to the same backend domain
- Both should be HTTPS

**If the script tag is incorrect or missing:**
- You need to update it on the `bizin-site` repository/project
- Contact whoever manages that site to add/update the script tag

### Step 3: Clear All Caches

**On your browser testing `bizin-site.vercel.app`:**

1. Open DevTools: Press `F12`
2. Go to Console tab
3. Paste and run this code:

```javascript
localStorage.clear();
sessionStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload(true);
```

**OR use hard refresh:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**OR test in incognito/private window:**
- This ensures no cache at all

### Step 4: Test the Widget

1. Open `https://bizin-site-p5y8sxqd7-marketing-neomarcas-projects.vercel.app` (with cleared cache)
2. Open the chat widget (usually bottom-right corner)
3. Type: **"quero agendar uma reunião de investimento"**
4. Wait for response

**Expected result:**
- ✅ Response in Portuguese
- ✅ Clickable link: "Consultoria de Investimento"
- ✅ Link goes to: `https://checkout.stripe.com/c/pay/cs_live_a19eZVk...eCUl`
- ✅ Link is 345 characters long (complete URL)
- ✅ No "LINKPLACEHOLDER" or truncation

**Check the link:**
- Hover over "Consultoria de Investimento"
- The tooltip should show the full Stripe URL
- Click it to verify it opens Stripe checkout

### Step 5: Test Secondary Link

Ask: **"quero agendar formação"** or **"preciso de consultoria de formação"**

**Expected result:**
- ✅ Clickable link: "Consultoria de Formação"  
- ✅ Different Stripe link (for training/formation)
- ✅ Also 345 characters, complete URL

## 🐛 Troubleshooting

### Issue: Links still show "LINKPLACEHOLDER_0_"

**Cause:** Old widget.js cached

**Solutions:**
1. Wait 1 hour for CDN cache to expire
2. Add cache-busting: `widget.js?v=2` in script tag
3. Check Vercel dashboard to confirm deployment completed
4. Verify the script `src` points to correct backend domain

### Issue: Links still truncated

**Cause:** 
- Using old knowledge base embeddings
- Backend not deployed yet

**Solutions:**
1. Re-run: `node verify-new-chunks.js` - should show 345 chars
2. If shows < 345 chars, re-upload document in admin panel
3. Check Vercel dashboard - ensure latest deployment is live

### Issue: Widget not loading at all

**Cause:**
- Incorrect `data-api-url`
- CORS issue
- Script blocked

**Solutions:**
1. Open browser console (F12 > Console tab)
2. Look for errors mentioning widget.js or CORS
3. Verify `data-api-url` matches your backend domain
4. Check CORS headers in `vercel.json` (already configured)

### Issue: Widget loads but shows old greeting

**Cause:** Browser cache

**Solution:**
- Full cache clear (see Step 3 above)
- Incognito window

## ✅ Success Criteria

- [ ] Found production backend URL
- [ ] Verified script tag on bizin-site has correct URLs
- [ ] Cleared all browser caches
- [ ] Widget loads successfully
- [ ] Response in Portuguese
- [ ] Clickable "Consultoria de Investimento" link
- [ ] Complete Stripe URL (345 chars)
- [ ] Link opens Stripe checkout correctly

## 📞 Need Help?

If issues persist after following all steps:

1. Share screenshot of browser console errors (F12 > Console)
2. Share the full URL of the production backend
3. Share screenshot of widget showing the issue
4. Confirm which step failed

## 🎉 When It Works

You'll see:
- Beautiful clickable link in the chat
- Clicking opens Stripe checkout instantly
- No weird placeholders or broken markdown
- URLs are complete and functional

The fix is complete in the code - just need to ensure deployment and caching are updated!
