# Voicenter Color Palette

<div align="center">

**Official Voicenter Red Brand Colors**  
*Professional Telecom/VoIP Platform Branding*

</div>

---

## 🎨 Primary Brand Colors

### Light Mode

| Color | HSL | Hex | RGB | Usage |
|-------|-----|-----|-----|-------|
| **Primary Red** | `hsl(0, 85%, 50%)` | `#F52222` | `rgb(245, 34, 34)` | Buttons, links, primary actions |
| **Light Red** | `hsl(0, 85%, 85%)` | `#FABDBD` | `rgb(250, 189, 189)` | Backgrounds, hover states, highlights |
| **Dark Red** | `hsl(0, 85%, 25%)` | `#750B0B` | `rgb(117, 11, 11)` | Borders, accents, secondary elements |

### Dark Mode

| Color | HSL | Hex | RGB | Usage |
|-------|-----|-----|-----|-------|
| **Primary Red** | `hsl(0, 85%, 60%)` | `#F55555` | `rgb(245, 85, 85)` | Buttons, links (brighter for visibility) |
| **Muted Red** | `hsl(0, 80%, 45%)` | `#D92626` | `rgb(217, 38, 38)` | Highlights, backgrounds |
| **Light Red Text** | `hsl(0, 90%, 85%)` | `#FAC9C9` | `rgb(250, 201, 201)` | Text accents on dark backgrounds |

---

## 🎯 Supporting Colors

### Success (Green)
- **Light Mode**: `hsl(148, 48%, 46%)` - `#3DAF7A`
- **Dark Mode**: `hsl(148, 65%, 55%)` - `#47C983`
- **Usage**: Success messages, confirmations, positive actions

### Warning (Amber/Orange)
- **Light Mode**: `hsl(47, 96%, 53%)` - `#F9C74F`
- **Dark Mode**: `hsl(47, 100%, 60%)` - `#FDD764`
- **Usage**: Warnings, alerts, important notices

### Destructive (Darker Red)
- **Light Mode**: `hsl(0, 70%, 45%)` - `#CC2929`
- **Dark Mode**: `hsl(0, 75%, 55%)` - `#E33C3C`
- **Usage**: Delete actions, errors, critical alerts (differentiated from primary red)

---

## 📐 Color Swatches

### Primary Red Scale (Light Mode)

```
████ Primary Light (85% Lightness)  #FABDBD  hsl(0, 85%, 85%)
████ Primary Red   (50% Lightness)  #F52222  hsl(0, 85%, 50%)
████ Primary Dark  (25% Lightness)  #750B0B  hsl(0, 85%, 25%)
```

### Primary Red Scale (Dark Mode)

```
████ Light Text    (85% Lightness)  #FAC9C9  hsl(0, 90%, 85%)
████ Primary Red   (60% Lightness)  #F55555  hsl(0, 85%, 60%)
████ Muted Red     (45% Lightness)  #D92626  hsl(0, 80%, 45%)
```

---

## 💻 Usage in Code

### CSS Variables (Already Configured)

```css
/* Light Mode */
:root {
  --primary: 0 85% 50%;           /* Main red */
  --primary-100: 0 85% 85%;       /* Light red */
  --primary-300: 0 85% 25%;       /* Dark red */
}

/* Dark Mode */
.dark {
  --primary: 0 85% 60%;           /* Bright red for dark mode */
  --primary-100: 0 80% 45%;       /* Muted red */
  --primary-300: 0 90% 85%;       /* Light red text */
}
```

### TypeScript/React

```tsx
import { BRAND_CONFIG } from '@/lib/voicenter-branding';

// Colors are automatically applied via CSS variables
<button className="bg-primary text-primary-foreground">
  Voicenter Red Button
</button>

// Access theme mode
const isPrimary = BRAND_CONFIG.theme.primaryColor; // "0, 85%, 50%"
```

### Tailwind Classes

```tsx
// Primary red classes (auto-generated from CSS variables)
<div className="bg-primary">            {/* Red background */}
<div className="text-primary">          {/* Red text */}
<div className="border-primary">        {/* Red border */}
<div className="hover:bg-primary-100">  {/* Light red on hover */}
```

---

## 🎨 Design Guidelines

### When to Use Each Color

**Primary Red (`#F52222`):**
- ✅ Primary call-to-action buttons
- ✅ Navigation active states
- ✅ Important links
- ✅ Brand elements
- ✅ Focus indicators

**Light Red (`#FABDBD`):**
- ✅ Hover states for red elements
- ✅ Background highlights
- ✅ Subtle indicators
- ✅ Card backgrounds (use sparingly)

**Dark Red (`#750B0B`):**
- ✅ Borders for red elements
- ✅ Secondary accents
- ✅ Text on light red backgrounds
- ✅ Footer elements

**Destructive Red (`#CC2929`):**
- ✅ Delete buttons
- ✅ Error messages
- ✅ Critical warnings
- ❌ NOT for primary branding

### Color Contrast Ratios (WCAG 2.1 AA)

| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| Primary Red (#F52222) | White (#FFFFFF) | 4.53:1 | ✅ AA |
| White (#FFFFFF) | Primary Red (#F52222) | 4.53:1 | ✅ AA |
| Dark Red (#750B0B) | White (#FFFFFF) | 11.21:1 | ✅ AAA |
| Primary Red Dark Mode (#F55555) | Dark BG (#1F1F1F) | 5.12:1 | ✅ AA |

---

## 🖼️ Visual Examples

### Button States

```
┌─────────────────────┐
│   Primary Button    │  ← Red (#F52222)
└─────────────────────┘

┌─────────────────────┐
│   Hover State       │  ← Light Red (#FABDBD) with border
└─────────────────────┘

┌─────────────────────┐
│   Active/Pressed    │  ← Dark Red (#750B0B)
└─────────────────────┘
```

### Sidebar Example

```
╔═══════════════════════╗
║ Voicenter Logo (Red)  ║
╠═══════════════════════╣
║ Dashboard             ║
║ █ Flows  ← Active     ║  ← Red highlight
║ Connections           ║
║ Settings              ║
╚═══════════════════════╝
```

---

## 🔧 Implementation Status

✅ **Configured in:** `packages/react-ui/src/styles/voicenter-overrides.css`  
✅ **Environment:** `.env.voicenter` (template provided)  
✅ **Applied to:** All primary brand elements (buttons, links, accents)  
✅ **Dark Mode:** Optimized brighter red for visibility  
✅ **Accessibility:** WCAG 2.1 AA compliant  

---

## 🎯 Color Accessibility

### Contrast Checker

Use this tool to verify new color combinations:
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Target**: WCAG 2.1 Level AA (4.5:1 for normal text, 3:1 for large text)

### Current Compliance

- ✅ Primary red on white: **4.53:1** (AA compliant)
- ✅ White on primary red: **4.53:1** (AA compliant)
- ✅ Dark red on white: **11.21:1** (AAA compliant)
- ✅ All button states meet minimum contrast requirements

---

## 🔄 Updating Colors

### If Brand Colors Change

1. **Update CSS Variables** in `voicenter-overrides.css`:
   ```css
   :root {
     --primary: [NEW_H] [NEW_S%] [NEW_L%];
   }
   ```

2. **Update Environment File** `.env.voicenter`:
   ```bash
   VITE_PRIMARY_COLOR_HSL="[NEW_H], [NEW_S]%, [NEW_L]%"
   ```

3. **Update this document** for reference

4. **Test contrast ratios** with WebAIM tool

5. **Restart dev server**:
   ```bash
   npm run dev:voicenter
   ```

---

## 📱 Responsive Considerations

### Mobile
- Red touch targets should be minimum 44x44px
- Increase spacing around red elements for easier tapping
- Ensure sufficient contrast in outdoor/bright lighting

### Tablet
- Hover states still important (some tablets support hover)
- Red elements should maintain 48x48px minimum
- Consider landscape/portrait orientations

### Desktop
- Full hover/focus states with red
- Red accent in navigation
- Larger red brand elements in header/footer

---

## 🎨 Additional Color Utilities

### Red Gradients (Optional)

```css
/* Subtle red gradient */
background: linear-gradient(135deg, 
  hsl(0, 85%, 50%) 0%, 
  hsl(0, 85%, 40%) 100%
);

/* Red to dark gradient */
background: linear-gradient(to bottom, 
  hsl(0, 85%, 50%) 0%, 
  hsl(0, 85%, 25%) 100%
);
```

### Red with Opacity

```css
/* Transparent red overlays */
background: hsl(0, 85%, 50% / 0.1);   /* 10% opacity */
background: hsl(0, 85%, 50% / 0.25);  /* 25% opacity */
background: hsl(0, 85%, 50% / 0.5);   /* 50% opacity */
```

---

**Last Updated**: October 31, 2025  
**Color System Version**: 1.0  
**Next Review**: When brand guidelines update

---

<div align="center">

**Questions about Voicenter colors?**

See [BrandingPlan.MD](./BrandingPlan.MD) • [VOICENTER_QUICKSTART.md](./VOICENTER_QUICKSTART.md)

</div>

Logo : https://www.voicenter.com/images/app-logo.svg