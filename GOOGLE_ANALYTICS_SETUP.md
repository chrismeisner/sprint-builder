# Google Analytics Setup Guide

This guide will help you integrate Google Analytics 4 (GA4) with your Next.js application.

## Overview

Google Analytics has been integrated into your application using:
- **Next.js Script component** for optimized loading
- **Client-side component** for tracking page views
- **Environment variables** for configuration

## Setup Steps

### 1. Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Admin" (gear icon in the bottom left)
4. Click "Create Property" (or use an existing one)
5. Follow the setup wizard:
   - Enter property name (e.g., "Sprint Builder Production")
   - Select your timezone and currency
   - Click "Next"
6. Fill in business information
7. Choose your business objectives
8. Accept the Terms of Service

### 2. Set Up a Data Stream

1. After creating the property, you'll be prompted to set up a data stream
2. Select **Web** as your platform
3. Enter your website details:
   - **Website URL**: Your production domain (e.g., `https://yourdomain.com`)
   - **Stream name**: e.g., "Sprint Builder Web"
4. Click "Create stream"
5. You'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
6. **Copy this Measurement ID** - you'll need it for the next step

### 3. Configure Environment Variables

#### For Local Development:

Create or update `.env.local` in your project root:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

#### For Production (Heroku):

Set the environment variable in Heroku:

```bash
heroku config:set NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Or via the Heroku Dashboard:
1. Go to your app's Settings
2. Click "Reveal Config Vars"
3. Add:
   - **KEY**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **VALUE**: Your Measurement ID (e.g., `G-XXXXXXXXXX`)

### 4. Test the Integration

#### Local Testing:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. Open Chrome DevTools (F12) → Network tab

4. Look for requests to `googletagmanager.com` - these indicate GA is loading

5. Go to Google Analytics → Reports → Realtime
   - You should see yourself as an active user

#### Verify Tracking:

1. Install the [Google Analytics Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

2. Enable the debugger and reload your page

3. Check the Console for GA debug messages

### 5. Testing in Production

After deploying:

1. Visit your production site
2. Check Google Analytics → Reports → Realtime
3. You should see active users
4. Navigate to different pages to verify page view tracking

## What Gets Tracked

The current implementation automatically tracks:

- **Page views**: Each time a user visits a page
- **Page paths**: The URL paths users visit
- **Session data**: User sessions and engagement time

## Advanced Configuration (Optional)

### Track Custom Events

To track custom events (like button clicks), you can add this function to your components:

```typescript
// Example: Track a button click
const handleClick = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'button_click', {
      event_category: 'engagement',
      event_label: 'sign_up_button',
    });
  }
  // Your button logic...
};
```

### Track User Properties

If you want to track user properties (like user role):

```typescript
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('set', 'user_properties', {
    user_role: 'admin',
  });
}
```

### Enable Enhanced Measurement

In Google Analytics:
1. Go to Admin → Data Streams
2. Click your web stream
3. Scroll to "Enhanced measurement"
4. Toggle on features like:
   - Scrolls
   - Outbound clicks
   - Site search
   - Video engagement
   - File downloads

## Privacy Considerations

### GDPR Compliance

If you have users in the EU, you may need to:

1. **Add a cookie consent banner**
2. **Only load GA after user consent**

Example implementation:

```typescript
// Only load GA if user has consented
'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';

export default function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    // Check if user has given consent
    const consent = localStorage.getItem('cookie_consent');
    setHasConsent(consent === 'true');
  }, []);

  if (!measurementId || !hasConsent) {
    return null;
  }

  // ... rest of the component
}
```

### IP Anonymization

GA4 automatically anonymizes IP addresses, but you can disable data collection for specific users:

```typescript
window.gtag('config', 'G-XXXXXXXXXX', {
  anonymize_ip: true,
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
});
```

## Troubleshooting

### Analytics Not Working?

1. **Check your Measurement ID**:
   - Verify it starts with `G-` (not `UA-`, which is old Universal Analytics)
   - Make sure there are no typos

2. **Check environment variable**:
   ```bash
   # In your terminal:
   echo $NEXT_PUBLIC_GA_MEASUREMENT_ID
   ```

3. **Check browser console**:
   - Open DevTools → Console
   - Look for any GA-related errors

4. **Verify the script is loading**:
   - View page source
   - Search for `googletagmanager.com`

5. **Check ad blockers**:
   - Disable ad blockers or privacy extensions
   - Try in an incognito window

### Data Not Showing in GA?

- **Wait 24-48 hours**: Historical reports can take time to populate
- **Use Realtime reports**: For immediate verification
- **Check filters**: Make sure you don't have filters excluding traffic

## Files Modified

The Google Analytics integration added/modified:

1. **`app/GoogleAnalytics.tsx`** - New component for GA tracking
2. **`app/layout.tsx`** - Updated to include GoogleAnalytics component
3. **`.env.local`** - Add your Measurement ID here
4. **`ENV_TEMPLATE.md`** - Documentation updated

## Resources

- [Google Analytics Documentation](https://support.google.com/analytics)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Next.js Analytics Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/events)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the Google Analytics Help Center
3. Verify your configuration in `.env.local` or Heroku config vars

