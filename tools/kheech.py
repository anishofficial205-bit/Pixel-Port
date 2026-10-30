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

# Decision-led: after the challenge, every section is one decision, set out the same way (the problem, what I
# decided, why), with the picture or clip that shows it.
DEC = lambda problem, decision, why: BUL(["The problem", problem], ["What I decided", decision], ["Why", why])

ITEMS = [
    {"t": "lead"},
    CLIP("clip-frame"),
    TAB(None,
        ["Type", "Personal project, interaction and visual design"],
        ["Built with", "Claude Code, MediaPipe hand tracking, WebGL"],
        ["Tested", "With several people, on their own hands"],
        ["Live", "kheech.vercel.app"]),
    RULE,

    H("The challenge", "Challenge"),
    P("A “hand frame” trend on Instagram was being made frame by frame in After Effects. The challenge: make it something anyone can do live, with nothing but a webcam, and make an interface with no buttons feel obvious."),
    RULE,

    H("Decision 1 · Run it live, in the browser", "Live"),
    DEC("The effect needed editing software and hours of keyframing, so only creators could make it.",
        "Track the thumb and index fingertips with MediaPipe, treat them as a window’s corners, and change the picture inside it with WebGL, in a web page.",
        "No app and no sign-up means anyone with a link can try it, and nothing leaves the device."),
    RULE,

    H("Decision 2 · Gestures instead of buttons", "Gestures"),
    DEC("Hands are busy holding the frame, and a tracking glitch can look like a gesture.",
        "Opening and closing the frame is one round, with a new look each time; it must stay open 0.4 seconds to count. Three shortcuts: pinch for the next look, a peace sign for a photo, pull wider for a stronger look.",
        "Every action is part of the gesture itself. A fourth, a fist to freeze, was cut because people made it by accident."),
    CLIP("clip-looks", cap="One round, one look: eighteen in all."),
    RULE,

    H("Decision 3 · Let people bring their own videos", "Own videos"),
    DEC("Filters were fun once; the effect needed to feel personal.",
        "Drop in any video and it plays inside the frame, only while the frame is open. When people couldn’t find how to add one, the steps moved onto the camera screen itself.",
        "Your own footage makes it yours, and a feature people can’t find doesn’t exist."),
    CLIP("clip-videos"),
    RULE,

    H("Decision 4 · Show the product, not a mascot", "Landing page"),
    DEC("The landing page had to explain a gesture toy before anyone allowed the camera.",
        "After three rounds (three directions, five in pixel art, then 4 layouts × 5 palettes), the pixel sky won, with its mascot replaced by a TV showing your live camera, asked for as the page loads.",
        "You see yourself before you press anything, which says what Kheech does faster than any copy. The name became KHEECH (खींच, “pull” in Hindi)."),
    PICS("riso", "pixel-crt", "lab-b", cap="How I got there: a riso zine, a pixel CRT, and the layout lab."),
    PICS("landing-hero", cap="Where it landed: the live-camera TV."),
    RULE,

    H("Decision 5 · One identity, nothing hidden", "Camera app"),
    DEC("The camera app was a plain dark screen, and its controls hid when the mouse was idle.",
        "Rebuild it in the landing page’s pixel style, with a coach that shows the hand pose until hands appear and every control always on screen.",
        "One product should feel like one product, and controls should never have to be found."),
    PICS("landing-how", "app-live", cap="How it works on the landing page, and the camera app."),
    RULE,

    H("Decision 6 · Reliability over features", "Reliability"),
    DEC("Tracking felt weak, and the app could sit on “Loading hands…” for minutes.",
        "Cut what wasn’t used (two frame shapes, a gesture, a look). Follow hands by position, with a 0.2-second grace when one is lost. Ship the 17 MB of tracker files with the site instead of fetching them from slow CDNs.",
        "A toy that hesitates stops being fun. Loading went from minutes to under a second."),
    RULE,

    H("Outcome", "Outcome"),
    P("Kheech is live: a pixel-art landing page and a camera app with eighteen looks, three gestures, photo and clip capture, and your own videos in the frame, tested with several people on their own hands. I vibe coded it with Claude Code: I made the decisions on this page; Claude Code wrote the code."),
    P("Next: a way to share photos and clips straight to reels."),
]
