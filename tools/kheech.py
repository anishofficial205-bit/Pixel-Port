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
        ["What it is", "A camera toy: a pixel-art landing page and a hand-tracked camera app"],
        ["Runs on", "The browser, with the webcam. No app, no sign-up, nothing uploaded"],
        ["Built with", "Google’s MediaPipe hand tracker (21 points per hand, about 30 times a second) and WebGL shaders for the looks"],
        ["Live at", "kheech.vercel.app"]),
    RULE,

    H("The spark: a trend made frame by frame", "The spark"),
    P("It began with three Instagram reels of a “dimensional hand masking” trend: people make a frame with their fingers, pull it open, and the world inside it turns into something else. One creator had keyframed it by hand in After Effects; another tagged it “python tricks”, a hint that hand tracking could do it live."),
    P("So the question was simple: can this run live, on a webcam, in a browser? The answer was yes. Track the thumb and index fingertips of both hands, treat them as the corners of a window, and draw a different version of the camera image inside that window."),
    RULE,

    H("The interaction: a frame you can hold", "Interaction"),
    P("The first build was one page with a single Spider-Verse comic look inside the finger frame: flat posterised colour, halftone dots, ink outlines and a red and blue misprint, animated at half the frame rate like the films. It worked on the first real try in Chrome. Then it had to feel precise, and stay surprising."),
    BUL(["Precise, not jittery.", "Fixed smoothing gave way to a One Euro filter, which smooths heavily when the fingertips are still and lightly when they move, so the frame neither shakes nor lags. The corners sit exactly on the fingertips, with small markers showing what is tracked."],
        ["Rounds.", "Opening the frame and closing it again is one round, and every round brings a new look. The frame has to stay open about 0.4 seconds to count, so a brief tracking glitch doesn’t skip a look."],
        ["The name pops up.", "Each look announces itself in a caption above the frame, so you always know what you just found."]),
    SUB("Three gestures, and the one that was cut"),
    BUL(["Pinch", "While the frame is open, pinch one hand to skip to the next look."],
        ["Peace sign", "Hold it up for a 3-2-1 countdown and a photo."],
        ["Pull wider", "The further apart your hands, the stronger the look gets."],
        ["Cut: fist to freeze", "A fist froze the background. It went, because it was too easy to make by accident."]),
    CLIP("clip-looks", cap="Thermal, Night Vision, X-Ray, VHS, 8-Bit, Neon and Zoom, one round at a time."),
    RULE,

    H("Making it personal: your own videos in the frame", "Your videos"),
    P("Filters were fun, but the effect became personal when the frame could hold your own footage. Videos are added with a button or by dragging them onto the screen, and they never leave the computer. Each round plays the next one; a video plays only while the frame is open and pauses when it closes."),
    P("Two trims came straight from first use: the red and cyan misprinted border round the frame felt noisy and became a plain ink line, and the file name stopped popping up over every video. Later, people didn’t know how to add their videos at all, so the steps now appear on the camera screen itself, in a guide, and on the landing page."),
    CLIP("clip-videos", cap="Footage from the city playing inside the frame, in a circle frame this time."),
    RULE,

    H("Finding the front door: four rounds of landing pages", "Landing page"),
    P("With the camera working, it needed a front door. The brief was “fun, aesthetic, and not AI slop”. Every direction came with a live demo, where the mouse stood in for the hand frame and the page changed inside it."),
    SUB("Round 1: three directions"),
    P("A riso zine with misprinted fluoro type, a comic page with drawn hands showing the gesture, and a dark camera viewfinder with an editorial serif. All three were set aside when two pixel-art references (a Tamagotchi site and a Cyber Monday email) set a better direction."),
    PICS("riso", "comic", "viewfinder", cap="Round 1: riso zine, comic page, viewfinder."),
    SUB("Round 2: five pixel directions"),
    P("Every headline in this round was built from a custom 5×7 pixel font, so the letters are real pixels. Sky had pixel clouds and a “night mode” window; CRT had a retro TV showing another channel; Paint used a marching-ants selection; Pocket was a handheld console; Storm was a word made of loose pixel particles. Sky won."),
    PICS("pixel-sky", "pixel-crt", "pixel-paint", cap="Sky, CRT and Paint."),
    PICS("pixel-pocket", "pixel-storm", cap="Pocket and Storm."),
    SUB("Round 3: the Sky lab, 4 layouts × 5 palettes"),
    P("To find the best Sky, the page became a lab: pick any layout, then any palette, and compare all twenty combinations live. Each palette had its own look inside the frame."),
    PICS("lab-a", "lab-b", cap="Billboard in Day, Split in Sunset."),
    PICS("lab-c", "lab-d", cap="Window in Mint, Horizon in Lilac."),
    P("The choice: the Split layout in the Day palette, with two changes. No hover mask on the landing page, and a TV showing your live camera in place of the pixel pet, to show the real product rather than a mascot."),
    RULE,

    H("The final landing page", "Final page"),
    P("The name changed from HAND FRAME to KHEECH (खींच, “pull” in Hindi): short, ownable, and a description of the gesture. The pixel TV asks for the webcam as the page loads and shows you live, so you see yourself before you press anything. The ticker along the bottom shrank from about 190 px to 43 px, because it was heavy and distracting."),
    PICS("landing-hero", cap="The hero: KHEECH in the pixel font, Press Start, and the TV showing the live camera."),
    P("How it works was rebuilt as three steps with pixel-hand illustrations (make an L, pull it apart, close and reopen), followed by the hand tricks, a section on playing your own videos, and a note that everything runs in the browser."),
    PICS("landing-how", cap="Three steps, each with its own pixel-hand illustration."),
    PICS("landing-tricks", cap="Hand tricks, your own videos, and the privacy note."),
    RULE,

    H("One identity: the camera app, redesigned", "Camera app"),
    P("The camera app was rebuilt in the landing page’s pixel style: a sky start screen with a pixel loading bar, a HUD with the logo, LIVE and a round counter, a coach that shows the hand pose until hands appear, and a dock of every look. Controls stay on screen, because they should never have to be found."),
    PICS("app-start", "app-live", cap="The start screen, and the live view: gestures on the left, frame settings on the right, looks along the bottom."),
    PICS("app-circle", "app-videos", cap="A circle frame with a glow edge, and the guide to playing your own videos."),
    P("The library grew to eighteen looks, grouped as Art, Camera and Wild: from Spider-Verse, Manga and Watercolour to Thermal, X-Ray, VHS, Glitch, Kaleido and Invisible. Photos and clips can be saved, and the frame shape, edge and sound settings are remembered between visits."),
    PICS("looks", cap="All eighteen looks on the same picture."),
    RULE,

    H("Doing less, but doing it well", "Reliability"),
    P("The last phase was about cutting and fixing. The Duo and Blob frame shapes went (rectangle and circle are enough), and so did the fist gesture and the Time Freeze look. Then the tracking, which felt weak, was rebuilt."),
    BUL(["Hands followed by position", "not by their left and right labels, which can flip when hands cross."],
        ["A 0.2-second grace", "for a hand lost for a split second, so the frame doesn’t flicker."],
        ["Lower thresholds", "to keep hold of hands through blur and odd angles."],
        ["More area to open than to stay open", "so the frame doesn’t blink at the edge."]),
    P("And the loading screen. The app sometimes sat on “Loading hands…” for minutes, because the tracker’s 9.4 MB engine and 7.8 MB hand model came from slow CDNs at start-up. The files now ship with the site, and the app is ready in under a second, with a backup, time limits, a slow-connection message and a working Try again."),
    RULE,

    H("What changed, and why", "Decisions"),
    TAB(["Change", "Replaced", "Why"],
        ["Plain ink frame border", "A red and cyan glitch border", "It felt noisy"],
        ["Your own videos in the frame", "Filters only", "Make the effect personal"],
        ["A live-camera TV on the landing page", "A pixel pet on a cloud", "Show the real product, not a mascot"],
        ["Named KHEECH", "HAND FRAME", "A short, ownable name: “pull” in Hindi"],
        ["Webcam asked for on page load", "Click the TV first", "Fewer steps to see yourself"],
        ["Controls always visible", "Controls that hid when idle", "Controls should never have to be found"],
        ["Tracker files shipped with the site", "Downloads from CDNs at start-up", "Slow CDNs left people waiting for minutes"],
        ["Fist gesture removed", "Fist to freeze", "Too easy to trigger by accident"]),
]
