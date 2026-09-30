"""Build assets/subway/pillar.png: a slim support column (64 art px) that stands over the subway -> stairwell seam.

usage: python3 tools/build_pillar.py
needs: pip install pillow numpy

Cut from the teal pillar in the subway strip (art x 5209-5319, rows 200-652): its two edges are kept,
the middle is narrowed, and the plain upper section is repeated upward so the column reaches the top of
the subway image (it has to cover the ceiling seam too). The electrical box is skipped.
"""
import numpy as np
from PIL import Image

sub = np.array(Image.open("assets/scenes/subway.webp").convert("RGB"))
LEFT, MID, RIGHT = (5209, 5221), (5225, 5261), (5303, 5319)   # outline + lit edge, plain face (no conduit), lit edge + outline
TOP_SLICE = (282, 310)        # plain concrete just above the electrical box (flattest light)
LOWER = (405, 652)            # blue band down to the base
HEIGHT = 652                  # column runs from the subway's top row to its base

def cols(rows):
    r0, r1 = rows
    return np.concatenate([sub[r0:r1, LEFT[0]:LEFT[1]], sub[r0:r1, MID[0]:MID[1]], sub[r0:r1, RIGHT[0]:RIGHT[1]]], axis=1)

lower = cols(LOWER)
slice_ = cols(TOP_SLICE)
upper_h = HEIGHT - lower.shape[0]
reps = -(-upper_h // slice_.shape[0])
upper = np.concatenate([slice_] * reps)[-upper_h:]
pillar = np.concatenate([upper, lower])
Image.fromarray(pillar).save("assets/subway/pillar.png", optimize=True)
print("pillar", pillar.shape[1], "x", pillar.shape[0])
