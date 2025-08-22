# 🧪 Development Guide - Testing the Processing Screen

## 🚀 **Quick Access Methods**

### **Method 1: Floating Dev Panel (Easiest)**
1. Start the dev server: `npm run dev`
2. Open `http://localhost:3001` in your browser
3. Look for the **🧪 Dev Controls** panel in the top-right corner
4. Click **"Processing"** to jump straight to the processing screen
5. The screen will auto-populate with demo data and start animating

### **Method 2: URL Parameters**
Add `?screen=processing` to the URL:
```
http://localhost:3001?screen=processing
```

### **Method 3: Direct Code Edit**
In `app/page.tsx`, temporarily change line 139:
```typescript
// Change from:
const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);

// To:
const [currentScreen, setCurrentScreen] = useState<Screen>("processing");
```

## 🎯 **What You'll See in Demo Mode**

### **Automatic Demo Data:**
- **Progress**: Starts at 45% and slowly increments to 100%
- **Stats**: Shows realistic processing metrics
- **Tips**: Rotating food facts every 3 seconds
- **Time**: Countdown from 5 seconds
- **Confidence**: Set to 85% to trigger the retake prompt

### **Features to Test:**
- ✅ Smooth progress bar animation
- ✅ Rotating food tips with transitions
- ✅ Time countdown
- ✅ Low confidence retake prompt (appears at 80%+ progress)
- ✅ Subtle chef animation
- ✅ Clean layout without clutter

## 🔧 **Customizing Demo Data**

### **Change Progress Speed:**
In the `useEffect` demo mode section (around line 595):
```typescript
// Change interval timing (currently 200ms)
const progressInterval = setInterval(() => {
  // Change increment (currently +2)
  const newProgress = Math.min(prev + 1, 100); // Slower
}, 500); // Slower updates
```

### **Test Different Confidence Levels:**
```typescript
confidence: 0.95  // High confidence (no retake prompt)
confidence: 0.85  // Low confidence (shows retake prompt)
confidence: 0.75  // Very low confidence
```

### **Modify Starting Progress:**
```typescript
setProcessingProgress(10);  // Start early in process
setProcessingProgress(85);  // Start near end to see retake prompt
```

## 📱 **Testing Different States**

### **Early Processing (0-30%):**
- Shows "Analyzing your image..."
- Simple progress bar
- Basic chef animation

### **Mid Processing (30-70%):**
- Shows "Extracting menu text..."
- Food tips are prominently displayed
- Stats start appearing

### **Late Processing (70-95%):**
- Shows "Finding dishes..."
- All stats visible
- Retake prompt appears if confidence < 90%

### **Complete (95-100%):**
- Shows "Almost done!"
- All animations complete

## 🎨 **Live Editing Tips**

### **Colors & Styling:**
The processing screen uses Tailwind classes. Key areas to modify:

```typescript
// Background gradient
className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-500"

// Progress bar
className="bg-white h-2 rounded-full"

// Food tip container
className="bg-white/15 backdrop-blur-sm rounded-xl p-4"
```

### **Animation Timing:**
Framer Motion animations can be adjusted:
```typescript
// Chef animation speed
transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}

// Tip rotation timing
animate={{ opacity: 1 }}
transition={{ duration: 0.8 }}
```

## 🐛 **Development Tools**

### **Console Logs:**
The app includes development logging. Check browser console for:
- Processing progress updates
- Food tip changes
- Demo mode activation

### **Hot Reload:**
- Edit any styling or animation
- Save the file
- Changes appear instantly in browser
- No need to refresh or navigate back

### **Reset Demo:**
Click the "Processing" button in the dev panel again to restart the demo animation.

## 📝 **File Locations**

- **Main Processing Screen**: `app/page.tsx` (lines ~1077-1580)
- **Food Tips**: `utils/foodTips.ts`
- **Framer Motion Animations**: Throughout processing screen component
- **Dev Controls**: `app/page.tsx` (lines ~1830-1854)

Enjoy testing the smooth, simplified processing experience! 🎉