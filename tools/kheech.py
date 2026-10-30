"""The Kheech project page: a UI/UX case study of a hand-tracked camera toy (kheech.vercel.app).

Every fact comes from Anish's write-up "Kheech: From Reel to Product" (a Claude doc, 2026-10-29), the live site and his
screen recording (assets/projects/kheech/clip-*.mp4, cut from kheechh.mp4). Nothing is invented: there is no user
testing section because no testing has been reported, and role and timeline wait for him (see js/data.js).
Pictures live in assets/projects/kheech/; tools/build_flow.py turns ITEMS into the page's flow.
"""
H = lambda tx, nav=None: {"t": "h", "tx": tx, "big": False, "nav": nav or tx}
SUB = lambda tx: {"t": "h", "tx": tx, "big": False, "sub": True}
P = lambda tx: {"t": "p", "tx": tx, "narrow": False}
BUL = lambda *items: {"t": "list", "plain": True, "items": [list(i) for i in items]}
TAB = lambda head, *rows: {"t": "table", "head": head, "rows": [list(r) for r in rows]}
PICS = lambda *names, cap=None: {"pics": list(names), "cap": cap}
CLIP = lambda name, cap=None: {"t": "video", "src": f"assets/projects/kheech/{name}.mp4", "poster": f"assets/projects/kheech/{name}-poster.webp", "ar": 1.778, "cap": cap}
RULE = {"t": "rule"}

ITEMS = [
    {"t": "lead"},
    CLIP("clip-frame"),
    TAB(None,
        ["Built with", "Claude Code, MediaPipe hand tracking, WebGL"],
        ["Tested", "With several people, on their own hands"],
        ["Runs", "In the browser. No app, no sign-up, nothing uploaded"]),
    RULE,

    H("The idea: an Instagram trend, made live", "Idea"),
    P("Creators were keyframing a “hand frame” effect by hand in After Effects. I wanted anyone to do it live on a webcam: track the thumb and index fingertips, treat them as the corners of a window, and change the picture inside it."),
    RULE,

    H("No buttons, three gestures", "Gestures"),
    P("Open and close the frame for a new look; it has to stay open 0.4 seconds to count, so a tracking glitch never skips one. A fourth gesture, a fist to freeze, was cut: people made it by accident."),
    BUL(["Pinch", "next look"], ["Peace sign", "3-2-1 photo"], ["Pull wider", "stronger look"]),
    CLIP("clip-looks", cap="Eighteen looks, one round at a time."),
    RULE,

    H("Your own videos inside the frame", "Your videos"),
    P("Drop in any video and it plays only while the frame is open. Nothing leaves the computer. When people couldn’t find how to add videos, the steps moved onto the camera screen itself."),
    CLIP("clip-videos"),
    RULE,

    H("Four rounds to find the look", "Exploration"),
    P("Three directions, then five in pixel art, then a lab of 4 layouts × 5 palettes. The pixel Sky won, with one change: a TV showing your live camera instead of a mascot, so the page shows the real product."),
    PICS("riso", "pixel-crt", "lab-b", cap="Round 1 (riso zine), round 2 (CRT) and the lab (Split in Sunset)."),
    RULE,

    H("The final product", "Final"),
    P("Renamed KHEECH (खींच, “pull” in Hindi). The landing page asks for the camera on load, so you see yourself before you press anything; the camera app shares its pixel style and keeps every control on screen."),
    PICS("landing-hero", cap="The landing page, with the live-camera TV."),
    PICS("landing-how", "app-live", cap="How it works, and the camera app."),
    RULE,

    H("Making it reliable", "Reliability"),
    P("Tracking felt weak, so hands are now followed by position, with a 0.2-second grace when one is lost. And “Loading hands…” could take minutes, because 17 MB of tracker files came from slow CDNs; they now ship with the site, and the app is ready in under a second."),
    RULE,

    H("How it was built", "Built with"),
    P("Vibe coded with Claude Code: I set the idea, the interaction and the look and made every call; Claude Code wrote the code. Tested with several people on their own hands."),
]
