"""
Subset Roboto Mono Variable down to figures and the marks that sit between them.

The full Latin cut Fontsource ships is 33 KB. Monospace here is only ever used
to line numbers up in a column — money, ratings, distances, counts, times — so
the letters in that file are paid for out of a prepaid data bundle and never
drawn.

The face is declared with a matching `unicode-range` (see src/index.css), so a
letter inside a `.mono` element is simply rendered in the body face instead of
falling back to tofu. That keeps the saving safe: nothing breaks if someone
later puts a word in a monospace span.

Run:  python scripts/subset-mono.py
Out:  src/fonts/roboto-mono-figures.woff2  (committed; regenerate if CHARS changes,
      and keep the unicode-range in index.css in step with it)
"""
from pathlib import Path
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules/@fontsource-variable/roboto-mono/files/roboto-mono-latin-wght-normal.woff2"
OUT = ROOT / "src/fonts/roboto-mono-figures.woff2"

# Space, digits, and every mark this interface sets beside a number:
#   R30,23/hr   4,6*   1,3x   06:14   -R500   84%   12.5 km   2013-2014 dashes
CHARS = " %()+,-./0123456789:R\u00b0\u00b7\u00d7\u2013\u2014\u2248\u2605\u2606"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source font missing: {SRC}\nRun npm install first.")

    options = subset.Options()
    options.flavor = "woff2"
    # Keep the weight axis: the interface sets figures at 400, 500 and 700.
    options.variations = True
    options.layout_features = ["kern", "tnum", "zero"]

    font = subset.load_font(str(SRC), options)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=CHARS)
    subsetter.subset(font)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(font, str(OUT), options)
    font.close()

    before, after = SRC.stat().st_size, OUT.stat().st_size
    print(f"{before:,} -> {after:,} bytes ({100 - after * 100 // before}% smaller)")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
