# Toast Notification System

A global toast notification system for the app using React Context and Tailwind CSS.

## Usage

The toast system is already set up globally in the app. To use it in any component:

```tsx
"use client";

import { useToast } from "@/lib/toast-context";

export default function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast("Operation completed successfully!", "success");
  };

  const handleError = () => {
    showToast("Something went wrong", "error");
  };

  const handleInfo = () => {
    showToast("Here's some information", "info");
  };

  const handleWarning = () => {
    showToast("Please be careful!", "warning");
  };

  // Custom duration (default is 5000ms)
  const handleCustomDuration = () => {
    showToast("This will disappear in 3 seconds", "info", 3000);
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleInfo}>Show Info</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleCustomDuration}>Custom Duration</button>
    </div>
  );
}
```

## API

### `useToast()`

Returns an object with:

- `showToast(message: string, variant?: ToastVariant, duration?: number)` - Show a toast notification
  - `message` - The message to display
  - `variant` - One of: `"success"`, `"info"`, `"warning"`, `"error"` (default: `"info"`)
  - `duration` - Duration in milliseconds before auto-dismiss (default: 5000). Set to 0 to disable auto-dismiss
  
- `dismissToast(id: string)` - Manually dismiss a toast (rarely needed)

- `toasts` - Array of currently displayed toasts (rarely needed)

## Styling

Toasts automatically adapt to light/dark mode and use the existing design system:

- **Success**: Green background with green text
- **Info**: Blue background with blue text  
- **Warning**: Amber background with amber text
- **Error**: Red background with red text

All toasts:
- Appear in the top-right corner
- Slide in from the right with animation
- Stack vertically if multiple are shown
- Can be manually dismissed via the × button
- Auto-dismiss after 5 seconds (configurable)

## Implementation Details

- Uses React Context for global state management
- Toasts are rendered in a portal-like container at the root layout level
- Multiple toasts can be shown simultaneously and will stack
- Toast component follows Tailwind best practices with no inline styles
- Fully accessible with proper ARIA attributes
