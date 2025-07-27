# Alert System Documentation

## Overview
The Alert system provides a lightweight, reusable notification component that displays alerts in the top-right corner of the screen. It features a black and white theme, automatic dismissal after 1.5 seconds, and no user permission required.

## Features
- ✅ **No Permission Required** - Alerts appear automatically
- ⏱️ **Auto-dismiss** - Disappears after 2 seconds (configurable)
- 📊 **Progress Bar** - Visual loading bar shows alert duration
- 🎨 **Black & White Theme** - Clean, modern styling
- 📍 **Top-right Position** - Fixed position in top-right corner
- 🔄 **Multiple Alerts** - Queue system for multiple alerts
- 🎯 **4 Alert Types** - Success, Error, Info, Warning
- 🐞 **Bug Fixed** - No more duplicate alerts on page load

## Usage

### Basic Usage
```tsx
import { useAlert } from '@/components/B-components/alert/AlertContext';

const MyComponent = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlert();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
};
```

### Advanced Usage
```tsx
import { useAlert } from '@/components/B-components/alert/AlertContext';

const MyComponent = () => {
  const { showAlert } = useAlert();

  const handleCustomAlert = () => {
    showAlert({
      message: 'Custom alert message',
      type: 'info',
      duration: 3000 // 3 seconds
    });
  };

  return (
    <button onClick={handleCustomAlert}>Show Custom Alert</button>
  );
};
```

## Alert Types

### 1. Success Alert
- **Background**: White
- **Text**: Black
- **Border**: Black
- **Icon**: ✓
- **Use Case**: Successful operations, confirmations

```tsx
showSuccess('Folder created successfully!');
```

### 2. Error Alert
- **Background**: Black
- **Text**: White
- **Border**: White
- **Icon**: ✕
- **Use Case**: Errors, failures, exceptions

```tsx
showError('Failed to save file');
```

### 3. Info Alert
- **Background**: Black
- **Text**: White
- **Border**: White
- **Icon**: ℹ
- **Use Case**: General information, tips

```tsx
showInfo('Welcome to your dashboard!');
```

### 4. Warning Alert
- **Background**: White
- **Text**: Black
- **Border**: Black
- **Icon**: ⚠
- **Use Case**: Warnings, important notices

```tsx
showWarning('Please save your work before leaving');
```

## API Reference

### useAlert Hook
Returns an object with the following methods:

#### `showSuccess(message: string)`
Shows a success alert.

#### `showError(message: string)`
Shows an error alert.

#### `showInfo(message: string)`
Shows an info alert.

#### `showWarning(message: string)`
Shows a warning alert.

#### `showAlert(props: AlertProps)`
Shows a custom alert with full configuration.

### AlertProps Interface
```tsx
interface AlertProps {
  message: string;           // Required: Alert message
  type?: 'success' | 'error' | 'info' | 'warning';  // Optional: Alert type (default: 'info')
  duration?: number;         // Optional: Duration in milliseconds (default: 2000)
  onClose?: () => void;      // Optional: Callback when alert closes
  style?: React.CSSProperties; // Optional: Custom styles
}
```

## Examples

### Multiple Alerts
```tsx
const handleMultipleAlerts = () => {
  showSuccess('First alert!');
  setTimeout(() => showError('Second alert!'), 200);
  setTimeout(() => showInfo('Third alert!'), 400);
};
```

### Custom Duration
```tsx
showAlert({
  message: 'This alert will stay for 5 seconds',
  type: 'info',
  duration: 5000
});
```

### With Callback
```tsx
showAlert({
  message: 'Alert with callback',
  type: 'success',
  onClose: () => {
    console.log('Alert closed!');
  }
});
```

## Styling
The alert system uses styled-components and follows a strict black and white theme:

- **Fixed positioning** in top-right corner
- **Smooth animations** for entry and exit
- **Progress bar** at the top showing remaining duration
- **Responsive design** with min/max width constraints
- **High z-index** (9999) to appear above other content
- **Hover effects** on close button

## Integration
The AlertProvider is already integrated into the main layout (`app/layout.tsx`), so you can use the `useAlert` hook in any component throughout the application.

## Integrated Components
The alert system is now integrated into the following components:

### ContextMenu (`components/B-components/saved-tools/ContextMenu.tsx`)
- **Open Tool**: Shows "Opening tool..." info alert
- **Remove Tool**: Shows "Tool removed successfully!" success alert
- **Create Folder**: Shows "Creating new folder..." info alert

### CreateFolderModal (`components/B-components/saved-tools/CreateFolderModal.tsx`)
- **Validation Errors**: Shows error alerts for invalid folder names
- **Required Field**: Shows error when folder name is empty
- **Length Limit**: Shows error when folder name exceeds 100 characters

### FolderSelectionMenu (`components/B-components/saved-tools/FolderSelectionMenu.tsx`)
- **Move Tool**: Shows success alert when tool is moved to folder

### Saved Tools Page (`app/saved-tools/page.tsx`)
- **Welcome Message**: Shows info alert on page load
- **Folder Operations**: Success/error alerts for create/delete operations
- **Tool Operations**: Success/error alerts for remove/move operations

## Demo
See `components/B-components/alert/AlertDemo.tsx` for a complete demonstration of all alert types and features. 