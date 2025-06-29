# PWA Assets Generator Script

This script can be used to generate PNG versions of the SVG icons for better compatibility.

## Manual Steps for Icon Generation

1. Open the SVG files in a vector graphics editor (like Inkscape, Adobe Illustrator, or online tools)
2. Export them as PNG files with the following specifications:

### Required PNG files:

- favicon.ico (16x16, 32x32, 48x48 - multi-size ICO file)
- icon-192x192.png (192x192)
- icon-512x512.png (512x512)
- apple-touch-icon.png (180x180)

### Online tools that can help:

- realfavicongenerator.net
- favicon.io
- Any SVG to ICO converter

### Command line (if you have ImageMagick installed):

```bash
# Convert SVG to PNG
convert favicon.svg -resize 32x32 favicon-32.png
convert favicon.svg -resize 16x16 favicon-16.png

# Create ICO file
convert favicon-16.png favicon-32.png favicon.ico

# Convert other icons
convert icon-192x192.svg icon-192x192.png
convert icon-512x512.svg icon-512x512.png
convert apple-touch-icon.svg apple-touch-icon.png
```

The SVG files will work in most modern browsers, but PNG/ICO provides better compatibility.
