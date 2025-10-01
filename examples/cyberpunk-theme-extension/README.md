# 🚀 Cyberpunk Theme Collection

A futuristic theme extension for App Shell featuring neon colors, glitch effects, and cyberpunk aesthetics.

## 🎨 Themes Included

### 1. Cyberpunk Neon

- **Colors**: Bright pink (#ff0080) and cyan (#00ffff) neon colors
- **Style**: High-contrast neon aesthetic with electric accents
- **Best for**: Night coding sessions, creative work

### 2. Cyberpunk Matrix

- **Colors**: Classic green matrix colors (#00ff41)
- **Style**: Inspired by The Matrix movie
- **Best for**: Terminal work, system administration

### 3. Cyberpunk Blade Runner

- **Colors**: Warm amber (#f0c674) and red (#e06c75) tones
- **Style**: Retro-futuristic 80s cyberpunk aesthetic
- **Best for**: Long coding sessions, warm ambiance

## ✨ Features

- **🎮 Three Unique Themes**: Each with carefully crafted color palettes
- **👾 Glitch Effects**: Optional animated glitch effects for authentic cyberpunk feel
- **⌨️ Keyboard Shortcuts**: Quick theme switching with `Ctrl+Shift+Alt+C`
- **🔧 Customizable Settings**: Control glitch intensity, animation speed
- **📱 Responsive Design**: Works across all app components

## 🚀 Installation

### Method 1: Install from File (Recommended for Testing)

1. Download or clone this extension folder
2. In App Shell, go to **Extensions** view in the sidebar
3. Click **"Browse for Extension File"** button
4. Navigate to the `cyberpunk-theme-extension` folder and select it
5. The extension will be installed and available immediately

### Method 2: Package and Install

1. Navigate to the extension directory:

   ```bash
   cd examples/cyberpunk-theme-extension
   ```

2. Create installation package:

   ```bash
   npm run package
   # Creates cyberpunk-theme-extension.zip
   ```

3. Install the .zip file using the Extensions view

## 🎯 Usage

### Applying Themes

1. **Via Settings**: Go to Settings → Appearance → Theme
2. **Via Command Palette**: `Cmd/Ctrl+Shift+P` → "Preferences: Color Theme"
3. **Via Extension Commands**: Use the extension's custom commands

### Extension Commands

Access these commands via the Command Palette (`Cmd/Ctrl+Shift+P`):

- **`Cyberpunk Theme: Toggle Glitch Effect`** - Enable/disable glitch animations
- **`Cyberpunk Theme: Cycle Cyberpunk Themes`** - Switch between the three themes
- **`Cyberpunk Theme: About Cyberpunk Theme`** - Show extension information

### Keyboard Shortcuts

- **`Ctrl+Shift+Alt+C`** - Cycle through all three cyberpunk themes

## ⚙️ Settings

Configure the extension through Settings → Extensions → Cyberpunk Theme:

```json
{
  "cyberpunk.glitchEffect": false, // Enable glitch animations
  "cyberpunk.neonIntensity": 0.8, // Glow effect intensity (0.0-1.0)
  "cyberpunk.animationSpeed": "normal" // Animation speed: slow/normal/fast
}
```

## 🎨 Customization

### Color Palette Overview

| Theme        | Primary | Secondary | Accent  | Background |
| ------------ | ------- | --------- | ------- | ---------- |
| Neon         | #00ffff | #ff0080   | #00ff80 | #0a0a0f    |
| Matrix       | #00ff41 | #008f11   | #00bf15 | #000000    |
| Blade Runner | #f0c674 | #e06c75   | #61afef | #0f0f1a    |

### Creating Custom Variants

1. Copy one of the theme files from `themes/` directory
2. Modify the colors to your preference
3. Update the `package.json` to include your new theme
4. Reinstall the extension

## 🛠️ Development

### File Structure

```
cyberpunk-theme-extension/
├── package.json              # Extension manifest
├── README.md                 # This file
├── src/
│   └── extension.js          # Main extension logic
└── themes/
    ├── cyberpunk-neon.json           # Neon theme definition
    ├── cyberpunk-matrix.json         # Matrix theme definition
    └── cyberpunk-blade-runner.json   # Blade Runner theme definition
```

### Extension Architecture

The extension demonstrates several key concepts:

1. **Theme Contribution**: Multiple theme files with different color schemes
2. **Command Registration**: Custom commands with keyboard shortcuts
3. **Settings Integration**: Configurable options for user preferences
4. **UI Enhancement**: Custom CSS injection for effects
5. **Event Handling**: Proper activation/deactivation lifecycle

### Key Extension APIs Used

- **Theme API**: Contributing themes through `package.json`
- **Command API**: Registering custom commands
- **Settings API**: Reading and writing user preferences
- **UI API**: Showing messages and notifications

## 🐛 Troubleshooting

### Theme Not Applying

- Ensure the extension is enabled in Extensions view
- Try restarting the application
- Check console for any error messages

### Glitch Effects Not Working

- Verify `cyberpunk.glitchEffect` is set to `true` in settings
- Check if your system supports CSS animations
- Try toggling the effect off and on again

### Performance Issues

- Disable glitch effects if experiencing slowdowns
- Reduce `cyberpunk.neonIntensity` setting
- Set `cyberpunk.animationSpeed` to "slow"

## 📄 License

MIT License - Feel free to modify and distribute

## 🤝 Contributing

This is an example extension for demonstration purposes. Feel free to:

- Fork and create your own theme variations
- Submit improvements to the base themes
- Report issues or suggest enhancements
- Use as a template for your own theme extensions

## 🎮 About Cyberpunk Themes

Inspired by cyberpunk culture, these themes bring the neon-soaked, high-tech aesthetic of futuristic cities to your development environment. Whether you're coding late into the night or just want to feel like a hacker in a sci-fi movie, these themes provide the perfect atmosphere.

**Happy Coding in the Future! 🚀👾**
