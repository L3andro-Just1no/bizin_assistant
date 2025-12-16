# 🚀 Bizin Agent Widget - Deployment Guide

## Widget is Ready! ✅

The widget has been successfully built and is located at:
- **File**: `public/widget.js` (353.61 kB, gzipped: 110.10 kB)

## Quick Test

1. **Local Test**: Open http://localhost:3000/widget-demo.html in your browser
2. **Next.js Demo**: Visit http://localhost:3000/embed

## Deployment Options

### Option 1: Deploy with Your Next.js App (Recommended)

The widget is already in the `public/` folder, so when you deploy your Next.js app to Vercel:

1. Deploy your app: `vercel --prod`
2. The widget will be available at: `https://your-domain.com/widget.js`

### Option 2: Separate CDN Deployment

If you want to host the widget separately (e.g., on a CDN):

1. Upload `public/widget.js` to your CDN or static hosting
2. Make sure CORS is enabled for your domains

## Integration Instructions

### Basic Integration (Auto-init)

Add this code before the closing `</body>` tag on any website:

```html
<!-- Bizin Agent Widget -->
<script 
  src="https://your-domain.com/widget.js"
  data-bizin-auto-init
  data-api-url="https://your-api-domain.com"
  data-language="pt"
  data-theme="light"
></script>
```

### Advanced Integration (Manual init)

For more control:

```html
<script src="https://your-domain.com/widget.js"></script>
<script>
  window.BizinAgent.init({
    apiUrl: 'https://your-api-domain.com',
    language: 'pt',  // 'pt' or 'en'
    theme: 'light',  // 'light' or 'dark'
    container: '#my-custom-container'  // optional
  });
</script>
```

### Custom Container

To embed the widget in a specific location instead of floating:

```html
<div id="chat-container"></div>

<script src="https://your-domain.com/widget.js"></script>
<script>
  window.BizinAgent.init({
    container: '#chat-container',
    apiUrl: 'https://your-api-domain.com'
  });
</script>
```

## Configuration Options

| Attribute | Description | Default | Values |
|-----------|-------------|---------|--------|
| `data-api-url` | Your API endpoint URL | Current domain | Any URL |
| `data-language` | Widget language | `pt` | `pt`, `en` |
| `data-theme` | Color theme | `light` | `light`, `dark` |
| `data-container` | CSS selector for container | Auto-create | Any CSS selector |

## Features Included

✅ **AI Chat** - GPT-4o powered conversations  
✅ **Voice Support** - Speech-to-text and text-to-speech  
✅ **Document Upload** - For paid sessions  
✅ **Free Tier** - 5 free messages per session  
✅ **Upgrade Modal** - Seamless upgrade to paid  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Auto-scroll** - Smooth message scrolling  
✅ **Typing Indicators** - Real-time feedback  

## Important Notes

### CORS Configuration

If hosting the widget on a different domain than your API, make sure to configure CORS in your Next.js API routes.

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### Environment Variables

Make sure these are set in production:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

### Rebuilding the Widget

If you make changes to the widget components, rebuild with:

```bash
npm run build:widget
```

## Testing Checklist

Before deploying to production:

- [ ] Test chat functionality
- [ ] Test voice recording (requires HTTPS in production)
- [ ] Test voice playback
- [ ] Test document upload (paid sessions)
- [ ] Test free tier limit (5 messages)
- [ ] Test upgrade modal
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Verify API endpoints are accessible
- [ ] Check CORS configuration

## Production Deployment

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

### Step 2: Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required environment variables
3. Redeploy if needed

### Step 3: Update Widget URL

Replace `https://your-domain.com/widget.js` with your actual Vercel URL:
- Example: `https://bizin-assistant.vercel.app/widget.js`

### Step 4: Test on Your Site

Add the widget script to your site (e.g., https://bizin-site.vercel.app/) and test all functionality.

## Support

For issues or questions:
- Email: geral@neomarca.pt
- Check logs in Vercel Dashboard
- Review Supabase logs for database issues
- Check OpenAI usage for API quota

## Next Steps

1. ✅ Widget is built and ready
2. 🚀 Deploy your Next.js app to Vercel
3. 🔗 Add the widget script to https://bizin-site.vercel.app/
4. 🧪 Test all features in production
5. 📊 Monitor usage in the admin dashboard

---

**Widget Version**: 1.0.0  
**Last Build**: December 2025  
**Framework**: React 19 + Vite 7

