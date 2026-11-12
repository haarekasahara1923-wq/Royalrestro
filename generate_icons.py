"""
Script to generate Android app icons from the Royal Comfort logo image.
It creates properly sized icons for all mipmap density folders.
"""

from PIL import Image
import os
import shutil

# Source logo image path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_IMAGE = os.path.join(SCRIPT_DIR, "public", "logo.png")

# Android res directory
RES_DIR = os.path.join(SCRIPT_DIR, "android", "app", "src", "main", "res")

# Icon sizes for each density
ICON_SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

# Foreground sizes (108dp at each density, with safe zone inside 72dp circle)
FOREGROUND_SIZES = {
    "mipmap-mdpi":    108,
    "mipmap-hdpi":    162,
    "mipmap-xhdpi":   216,
    "mipmap-xxhdpi":  324,
    "mipmap-xxxhdpi": 432,
}

def make_round_icon(img, size):
    """Create a circular icon from the given image."""
    from PIL import ImageDraw
    img = img.convert("RGBA")
    img = img.resize((size, size), Image.LANCZOS)

    # Create a circular mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)

    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask)
    return output


def make_foreground(img, canvas_size, icon_size):
    """
    Create adaptive icon foreground:
    - Canvas = canvas_size x canvas_size (108dp equivalent)
    - Logo placed centered in the safe zone (icon_size = 72dp equivalent)
    """
    img = img.convert("RGBA")
    # Scale logo to fit within safe zone (72dp equivalent)
    logo_resized = img.resize((icon_size, icon_size), Image.LANCZOS)
    # Place centered on transparent canvas
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset = (canvas_size - icon_size) // 2
    canvas.paste(logo_resized, (offset, offset), logo_resized)
    return canvas


def main():
    if not os.path.exists(SOURCE_IMAGE):
        print(f"ERROR: Source image not found at: {SOURCE_IMAGE}")
        print("Please save the logo as 'logo.jpg' in the public folder.")
        return

    print(f"Loading source image from: {SOURCE_IMAGE}")
    src = Image.open(SOURCE_IMAGE)
    print(f"Source image size: {src.size}")

    # Generate standard launcher icons
    for folder, size in ICON_SIZES.items():
        out_dir = os.path.join(RES_DIR, folder)
        os.makedirs(out_dir, exist_ok=True)

        # ic_launcher.png (square with white/cream background)
        bg = Image.new("RGB", (size, size), (245, 240, 230))  # cream background
        logo = src.convert("RGBA").resize((size, size), Image.LANCZOS)
        bg.paste(logo, (0, 0), logo)
        out_path = os.path.join(out_dir, "ic_launcher.png")
        bg.save(out_path, "PNG")
        print(f"Saved: {out_path}")

        # ic_launcher_round.png (circular)
        round_icon = make_round_icon(src, size)
        # Add cream background to round icon
        bg_round = Image.new("RGBA", (size, size), (245, 240, 230, 255))
        bg_round.paste(round_icon, (0, 0), round_icon)
        out_path_round = os.path.join(out_dir, "ic_launcher_round.png")
        bg_round.save(out_path_round, "PNG")
        print(f"Saved: {out_path_round}")

        # ic_launcher_foreground.png (for adaptive icons)
        canvas_size = FOREGROUND_SIZES[folder]
        icon_size = size  # logo fits within the 72dp safe zone
        fg = make_foreground(src, canvas_size, icon_size)
        out_path_fg = os.path.join(out_dir, "ic_launcher_foreground.png")
        fg.save(out_path_fg, "PNG")
        print(f"Saved: {out_path_fg}")

    print("\n✅ All icons generated successfully!")
    print("Now open Android Studio and rebuild the project.")


if __name__ == "__main__":
    main()
