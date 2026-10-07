/* ------------------------------------------------------------------
   SITE CONTENT — everything here is placeholder.
   Swap text, links and media as the real content comes in.
   Images use picsum.photos seeds until real work is added.
------------------------------------------------------------------- */
window.SITE = {
  featured() { return this.projects.filter((p) => p.featured); },
  // the projects shown on the home page: the featured four, then those marked home (no subway billboard of their own)
  home() { return [...this.featured(), ...this.projects.filter((p) => p.home && !p.featured)]; },
  // A project picture at a sensible size. The case-study pictures live in assets/projects/<project>/ in four
  // widths (tools/localise_framer.py): full, 1280, 640 and a 32 px one used blurred behind things.
  img(id, size = 2048) {
    if (!id || !/^assets\/projects\/(thrive|krumble|parde-ke-peeche|haven)\/\d+\.webp$/.test(id)) return id;   // anything else is used as it is
    return id.replace(/\.webp$/, (size <= 64 ? "-32" : size <= 640 ? "-640" : size <= 1280 ? "-1280" : "") + ".webp");
  },
  // ...and for a picture shown in a small slot (a billboard, a card): both smaller widths, for the browser to choose from
  srcset(id) { const a = this.img(id, 640), b = this.img(id, 1280); return a === b ? "" : `${a} 640w, ${b} 1280w`; },

  name: "ANISH",
  role: "Visual & Product Designer",
  intro: "Hi! I design things for screens and streets. Scroll down, chalo, let's go on a ride through my work.",
  location: "Mumbai, India",
  email: "anishofficial205@gmail.com",
  mailSubject: "Let’s work together",
  resume: "https://drive.google.com/file/d/11oDHz7qk81Wuk0ODuT-aQ4vFoU7OKGQZ/view?usp=sharing",
  // the footer's words, from the Framer site
  footer: { kicker: "This is the part where I say", title: ["Let’s", "Connect!"], line: "Also, I like Kit Kat because every designer needs a break. :)" },
  year: new Date().getFullYear(),

  socials: [
    { label: "LinkedIn", short: "in", url: "https://www.linkedin.com/in/anishshah205" },
    { label: "Résumé", short: "cv", url: "https://drive.google.com/file/d/11oDHz7qk81Wuk0ODuT-aQ4vFoU7OKGQZ/view?usp=sharing" },
  ],

  /* About me, down the drain: the portrait (left) steps through its frames as you scroll, and the text
     (right) lights up word by word. Each text entry is a paragraph; an optional label shows in front of it. */
  about: {
    title: "About me",
    tags: ["Branding", "Packaging", "UI/UX", "Editorial Design"],
    marks: ["starts with the story", "films", "food", "travel", "truly means something"],   // highlighted in the Simple view
    portrait: { src: "assets/about/portrait-frames.webp", frames: 3, w: 280, h: 400 },
    text: [
      { text: "I’m Anish Shah, a 20-year-old designer who starts with the story and lets the visuals follow, always building alongside people. I find my inspiration in films that change the way I see the world, food that brings me joy, and travel that keeps my imagination restless. I translate feelings into design, so the work doesn’t just look good but truly means something." },
    ],
  },

  /* All projects, from anishah.framer.website. featured: true puts a project on a subway billboard
     (the first 4 featured ones, in order); every project is listed on projects.html.
     shape: "wide" (metal frame, ~2:1 window) or "tall" (cyan LED, ~9:17 window).
     cover/hero/img values are picture paths; SITE.img() picks a size.
     outcome: paragraphs for an "Outcome and learnings" block at the end of the case study (shown only when filled in).
     blocks: {h} heading, {p} paragraph, {img,w,h} image, {list:[[title, text]]} feature list.
     ads (optional): what the street billboards show, per board shape: wide (~2.5:1) and tall (~1:2.2).
       Framer ids or local paths; animated WebP/GIF work. Without it the cover is used. Images fill their board
       (cropped to its shape), so pick ones whose subject sits in the middle. */
  projects: [
    {
      "id": "thrive",
      "featured": true,
      "ads": {"wide": ["assets/projects/thrive/01.webp"], "tall": ["assets/projects/thrive/01.webp"]},
      "title": "Thrive",
      "line": "Line 1",
      "blurb": "Brand identity for eco-friendly desk accessories",
      "shape": "wide",
      "band": "#3DF2FF",
      "cover": "assets/projects/thrive/01.webp",
      "intro": "Brand identity for Thrive, a modular, eco-friendly desk-accessory brand that feels premium but stays affordable.",
      "lead": "Thrive brings a refined, minimalist visual identity to modern workspaces, transforming functional desk accessories into a cohesive, premium yet accessible experience that reflects clarity, intention, and everyday productivity.",
      "meta": {
        "year": "2024",
        "timeframe": "3 Weeks",
        "tools": "Photoshop, Illustrator, Blender",
        "category": "Branding",
        "collaboration": "Individual Project"
      },
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": [
        {
          "h": "Problem"
        },
        {
          "p": "The workspace market is split between overpriced premium products and low-quality budget options, with little focus on sustainability, modularity, or personality. Professionals struggle to find a brand that feels warm, modern, and functional while still being accessible."
        },
        {
          "h": "Solution"
        },
        {
          "p": "Thrive offers a modern, modular, sustainable workspace brand that blends premium aesthetics with everyday affordability. Its warm, relatable identity and thoughtful functionality create a smart, calm ecosystem designed for real productivity."
        },
        {
          "img": "assets/projects/thrive/02.webp",
          "w": 1400,
          "h": 70
        },
        {
          "img": "assets/projects/thrive/03.webp",
          "w": 1587,
          "h": 1060
        },
        {
          "img": "assets/projects/thrive/04.webp",
          "w": 1587,
          "h": 1185
        },
        {
          "h": "Logo"
        },
        {
          "p": "The logo process involved a lot of experimentation with styles, symbols, and treatments. While some directions worked visually, they did not align with what Thrive stood for. Some felt too decorative, others too generic. Feedback from peers and mentors helped me realise I was overcomplicating the design. I stepped back and shifted my focus to simplicity. After refining and testing multiple variations, I arrived at a minimal, modern wordmark that feels confident, quiet, and flexible enough to grow with the brand."
        },
        {
          "img": "assets/projects/thrive/05.webp",
          "w": 1400,
          "h": 359
        },
        {
          "img": "assets/projects/thrive/06.webp",
          "w": 22773,
          "h": 5689
        },
        {
          "img": "assets/projects/thrive/07.webp",
          "w": 1400,
          "h": 450
        },
        {
          "img": "assets/projects/thrive/08.webp",
          "w": 1400,
          "h": 450
        },
        {
          "img": "assets/projects/thrive/09.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/10.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/11.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/12.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/13.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/14.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/15.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/16.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/17.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "assets/projects/thrive/18.webp",
          "w": 1920,
          "h": 1080
        },
        {
          "h": "Colour"
        },
        {
          "p": "The colour palette for Thrive uses muted teal tones that feel modern and naturally grounded. Chosen to convey calm, clarity, and subtle luxury, the deeper teal adds depth and sophistication while the lighter tone brings balance and softness. Together, they create a clean, refined aesthetic that reflects Thrive’s affordable premium workspace identity."
        },
        {
          "img": "assets/projects/thrive/19.webp",
          "w": 1400,
          "h": 200
        },
        {
          "img": "assets/projects/thrive/20.webp",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "assets/projects/thrive/21.webp",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "assets/projects/thrive/22.webp",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "assets/projects/thrive/23.webp",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "assets/projects/thrive/24.webp",
          "w": 4032,
          "h": 3024
        },
        {
          "h": "Products"
        },
        {
          "p": "To explore how Thrive could exist in the real world, I recreated market products in Blender and applied the brand’s logo and colours. This helped me understand how the identity translates onto physical forms while experimenting with 3D. Alongside this, I created product sketches to study proportions, materials, and design directions. Together, the sketches and renders helped bring Thrive closer to a tangible workspace experience."
        },
        {
          "img": "assets/projects/thrive/25.webp",
          "w": 4000,
          "h": 3000
        },
        {
          "img": "assets/projects/thrive/26.webp",
          "w": 4000,
          "h": 3000
        },
        {
          "img": "assets/projects/thrive/27.webp",
          "w": 4500,
          "h": 2812
        },
        {
          "img": "assets/projects/thrive/28.webp",
          "w": 5472,
          "h": 3635
        },
        {
          "img": "assets/projects/thrive/29.webp",
          "w": 4184,
          "h": 2414
        },
        {
          "img": "assets/projects/thrive/30.webp",
          "w": 4500,
          "h": 3500
        },
        {
          "img": "assets/projects/thrive/31.webp",
          "w": 4500,
          "h": 3003
        },
        {
          "img": "assets/projects/thrive/32.webp",
          "w": 4092,
          "h": 2880
        },
        {
          "img": "assets/projects/thrive/33.webp",
          "w": 5000,
          "h": 3336
        },
        {
          "img": "assets/projects/thrive/34.webp",
          "w": 2497,
          "h": 1637
        }
      ]
    },
    {
      "id": "krumble",
      "featured": true,
      "ads": {"wide": ["assets/projects/krumble/01.webp"], "tall": ["assets/projects/krumble/02.webp", "assets/projects/krumble/03.webp"]},
      "title": "Krumble",
      "line": "Line 2",
      "blurb": "Festive gift packaging for Haldiram’s cookies",
      "shape": "tall",
      "band": "#FF3D9A",
      "cover": "assets/projects/krumble/02.webp",
      "hero": "assets/projects/krumble/01.webp",
      "intro": "A packaging design project reimagining Haldiram’s cookies as a premium, festive-ready gifting experience.",
      "lead": "In India, cookies rarely make good gifts because their packaging seems too plain and functional. I reimagined Haldiram’s cookies as a festive gift, transforming a familiar product into a special keepsake for celebrations.",
      "meta": {
        "year": "2025",
        "timeframe": "3 Weeks",
        "tools": "Photoshop, Illustrator",
        "category": "Packaging",
        "collaboration": "Individual Project"
      },
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": [
        {
          "img": "assets/projects/krumble/04.webp",
          "w": 2528,
          "h": 1696
        },
        {
          "img": "assets/projects/krumble/05.webp",
          "w": 1746,
          "h": 1513
        },
        {
          "h": "The problem"
        },
        {
          "p": "The existing Haldiram’s cookie packaging is functional but not memorable. Most designs rely on busy colours, flat layouts, and a strong focus on product display, which works for everyday retail but falls short for gifting. They lack warmth, presence, and a sense of occasion, making the experience feel transactional rather than celebratory. This absence of emotion and visual hierarchy created an opportunity to rethink the packaging as something more thoughtful and gift-worthy."
        },
        {
          "img": "assets/projects/krumble/06.webp",
          "w": 2757,
          "h": 3873
        },
        {
          "img": "assets/projects/krumble/07.webp",
          "w": 2611,
          "h": 3835
        },
        {
          "img": "assets/projects/krumble/08.webp",
          "w": 2761,
          "h": 3867
        },
        {
          "h": "Sketches"
        },
        {
          "p": "These sketches marked the starting point of the project, where I studied existing cookie packaging and identified gaps such as repetitive structures, plastic-heavy formats, and a lack of user experience or sense of occasion. By sketching current systems alongside new ideas, I explored silhouettes, opening mechanisms, materials, and more intentional forms. This phase focused on reimagining the cookie box as premium and gift-worthy, laying the foundation for the final packaging structure."
        },
        {
          "img": "assets/projects/krumble/09.webp",
          "w": 21167,
          "h": 4162
        },
        {
          "h": "Colour"
        },
        {
          "p": "The colour palette follows a flavour coding system, with each variant assigned a rich tone within the same warm family. Deep reds and burgundies create a premium, festive feel suited for gifting, while subtle shifts in shade distinguish flavours. This approach keeps the range cohesive, elegant, and instantly recognisable."
        },
        {
          "img": "assets/projects/krumble/10.webp",
          "w": 23385,
          "h": 16535
        },
        {
          "h": "Material"
        },
        {
          "p": "To ensure the cookies remain intact from shelf to celebration, the packaging uses rigid chipboard. This choice provides superior structural integrity and impact resistance, ensuring that premium aesthetics are matched by a breakage-free experience."
        },
        {
          "img": "assets/projects/krumble/03.webp",
          "w": 1696,
          "h": 2528
        },
        {
          "img": "assets/projects/krumble/02.webp",
          "w": 1696,
          "h": 2528
        },
        {
          "img": "assets/projects/krumble/11.webp",
          "w": 1928,
          "h": 1696
        },
        {
          "img": "assets/projects/krumble/12.webp",
          "w": 1748,
          "h": 1240
        }
      ]
    },
    {
      "id": "parde-ke-peeche",
      "featured": true,
      "ads": {"wide": ["assets/projects/parde-ke-peeche/01.webp"], "tall": ["assets/projects/parde-ke-peeche/02.webp"]},
      "title": "Parde Ke Peeche",
      "line": "Line 3",
      "blurb": "A magazine on the craft behind Bollywood",
      "shape": "wide",
      "band": "#FF9933",
      "cover": "assets/projects/parde-ke-peeche/02.webp",
      "hero": "assets/projects/parde-ke-peeche/01.webp",
      "intro": "A publication design project exploring the unseen craft, design, and storytelling behind Bollywood.",
      "lead": "Parde Ke Peeche is a 20-page publication I designed as part of my communication design program. The magazine explores the hidden craft of Bollywood, such as cinematography, sound design, choreography, set design, poster art, and motion titles. Instead of focusing on celebrity culture, the publication celebrates the people and processes that shape the visual experience of Indian cinema.",
      "meta": {
        "year": "2025",
        "timeframe": "2 Weeks",
        "tools": "InDesign, Photoshop",
        "category": "Publication Design"
      },
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": [
        {
          "img": "assets/projects/parde-ke-peeche/03.webp",
          "w": 5000,
          "h": 3335
        },
        {
          "h": "Grid"
        },
        {
          "p": "Most of the magazine is built using 2-column and 3-column grids, which gave the layouts a balanced, readable structure while still allowing room for cinematic visual pacing. These grids form the core of the publication’s rhythm: tight enough to hold long-form content comfortably, but flexible enough to pair with full-bleed images, asymmetrical compositions, and occasional single-column moments. While the overall system is anchored in these two grids, a few spreads intentionally break out of them for visual impact, creating a mix of consistency and expressive variation throughout the magazine."
        },
        {
          "img": "assets/projects/parde-ke-peeche/04.webp",
          "w": 3810,
          "h": 2710
        },
        {
          "h": "Spreads"
        },
        {
          "img": "assets/projects/parde-ke-peeche/05.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/06.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/07.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/08.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/09.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/10.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/11.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/12.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/13.webp",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "assets/projects/parde-ke-peeche/14.webp",
          "w": 1400,
          "h": 422
        }
      ]
    },
    {
      "id": "haven",
      "featured": true,
      "ads": {"wide": ["assets/projects/haven/01.webp"], "tall": ["assets/projects/haven/01.webp"]},
      "title": "Haven",
      "line": "Line 4",
      "blurb": "A safe space to learn and practise consent",
      "shape": "wide",
      "band": "#FFC21A",
      "cover": "assets/projects/haven/01.webp",
      "intro": "A UI/UX project exploring consent as a lived experience for Indian adolescents, designing culturally sensitive ways to practise boundaries across social, digital, and intimate spaces.",
      "lead": "This project explores consent as a lived experience for Indian youth, revealing gaps between awareness and action shaped by culture and power. It proposes a confidential digital platform that blends expert guidance, peer dialogue, and scenario-based learning to help young people practise boundaries and build respectful relationships.",
      "meta": {
        "year": "2025",
        "timeframe": "6 Weeks",
        "tools": "Figma, Perplexity",
        "category": "UI/UX",
        "collaboration": "Individual Project"
      },
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": [
        {
          "img": "assets/projects/haven/02.webp",
          "w": 7680,
          "h": 4316
        },
        {
          "h": "Project Overview"
        },
        {
          "p": "Consent is often taught as a rule rather than a lived experience. This project explores the gap between how Indian adolescents understand consent in theory and how they navigate it in everyday life, reframing consent as an ongoing, emotional, and contextual practice."
        },
        {
          "h": "Problem Context"
        },
        {
          "p": "Young people aged 16–22 understand consent in theory as clear and voluntary, but this clarity often collapses in real situations involving peer pressure, digital spaces, or authority. In India, consent education is often avoided or superficial, leaving adolescents without practical tools to assert boundaries or respond to violations."
        },
        {
          "h": "Secondary Research"
        },
        {
          "p": "I studied Comprehensive Sexuality Education (CSE) in India and found it largely limited to biology and abstinence, often avoiding consent, relationships, gender sensitivity, and digital safety. Educator discomfort, policy gaps, and cultural taboos restrict open discussion. In contrast, global frameworks treat consent as ongoing and contextual, highlighting it as a critical gap in Indian CSE."
        },
        {
          "img": "assets/projects/haven/03.webp",
          "w": 4588,
          "h": 3593
        },
        {
          "h": "Primary Research"
        },
        {
          "p": "To ground these insights in lived experience, I conducted participatory and qualitative research with urban youth. A “Consent Wall” activity captured instinctive Yes, No, and Maybe responses to everyday scenarios, revealing collective discomforts often missed in interviews. This was followed by group discussions that surfaced peer dynamics, contradictions, and unspoken rules around boundaries."
        },
        {
          "img": "assets/projects/haven/04.webp",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "assets/projects/haven/05.webp",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "assets/projects/haven/06.webp",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "assets/projects/haven/07.webp",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "assets/projects/haven/08.webp",
          "w": 5712,
          "h": 2506
        },
        {
          "h": "Key Findings"
        },
        {
          "p": "Research shows consent is understood as multifaceted, extending beyond sexual intimacy to everyday actions. Although explicit verbal consent was preferred, many participants stayed silent or endured discomfort to avoid awkwardness or judgment."
        },
        {
          "img": "assets/projects/haven/09.webp",
          "w": 3653,
          "h": 2713
        },
        {
          "h": "How Might We"
        },
        {
          "p": "How might we create engaging and culturally relatable ways for young people aged 16–22 in India to learn and practise consent beyond traditional education systems, so they can confidently assert boundaries and build respectful relationships across social, digital, and intimate spaces?"
        },
        {
          "h": "Synthesis & Insight Development"
        },
        {
          "p": "Affinity and empathy mapping revealed confusion around consent, with silence or persistence often mistaken for agreement. Media and cultural narratives normalized coercion, framing consent as situational and making refusal feel unsafe. Despite awareness, consent often failed in practice due to cultural silence, peer pressure, and limited education."
        },
        {
          "h": "Proposed Solution"
        },
        {
          "p": "I proposed a culturally sensitive digital platform for Indian adolescents that blends expert guidance with peer-led support. It offers confidential access to psychologists and intimacy coordinators through consultations, workshops, and Q&A sessions, alongside anonymous peer-sharing spaces that reduce stigma and foster empathy without fear of judgment."
        },
        {
          "img": "assets/projects/haven/10.webp",
          "w": 5051,
          "h": 3478
        },
        {
          "h": "What is Haven"
        },
        {
          "p": "Haven is a culturally sensitive digital platform designed for young people aged 16–22 to explore consent, boundaries, mental health, and relationships in a safe, non-judgmental space. It combines anonymous expression, interactive learning, peer support, and access to professionals, helping users navigate real-life situations with clarity, confidence, and emotional safety."
        },
        {
          "h": "Features of the App"
        },
        {
          "list": [
            [
              "Anonymous Community Spaces",
              "Users share experiences anonymously in empathetic, peer-led spaces built on trust and understanding."
            ],
            [
              "Interactive Story Scenarios",
              "Choice-based narratives mirror real consent dilemmas, helping users learn through reflection and consequences."
            ],
            [
              "Professional Support Access",
              "Confidential sessions with psychologists, intimacy coordinators, and legal advisors offer credible guidance."
            ],
            [
              "Peer Support Circles",
              "Moderated group spaces encourage shared listening, discussion, and resilience without judgment."
            ],
            [
              "Privacy-First Design",
              "Strong anonymity, moderation, and consent-led interactions keep users safe and in control."
            ]
          ]
        },
        {
          "h": "Conclusion"
        },
        {
          "p": "This project reimagines consent education through a human-centered UI/UX lens, treating consent not as a rule to be taught but as a skill to be practised. By combining participatory research, culturally sensitive design, and emotionally safe interactions, the project bridges the gap between awareness and real-life behavior. Haven demonstrates how thoughtful design can create trust, encourage difficult conversations, and empower young people to navigate relationships with clarity, autonomy, and respect."
        }
      ]
    },
    {
      // from behance.net/gallery/248967119 (a team project). Its page is laid out in tools/build_flow.py; photos in assets/projects/bhayanaka
      "id": "bali",
      "featured": false, "home": true,
      "title": "Bali",
      "line": "Line 5",
      "blurb": "Production design for a short horror film",
      "shape": "wide",
      "band": "#D8261C",
      "cover": "https://i.vimeocdn.com/video/2156354653-0a8256fe1d25e5e9a73fe937a82c2edad5f9e8cebb9eee1dfb8c0d7073ac9f69-d_1280x720?region=us",
      "heroEmbed": "https://player.vimeo.com/video/1191228759?title=0&byline=0&portrait=0&badge=0&controls=1&color=ffffff&loop=1",
      "source": "https://www.behance.net/gallery/248967119/A-production-design-project",
      "sourceLabel": "View this project on Behance",
      "intro": "A production design project: designing and dressing a room to evoke dread and unease, for a script titled Bhayānaka.",
      "lead": "For our production design project, we were given a script titled Bhayānaka, a word rooted in the Sanskrit rasa of fear. The assignment called for designing and dressing an environment to evoke dread and unease, using props, textures, lighting, and surface treatments to suggest a history of violence and ritual. The real challenge lay in transforming a familiar, everyday space into something ancient, abandoned, and deeply unsettling, where every detail left behind tells a story without a single word of dialogue. What we built was a room that felt occupied by something that had already happened.",
      "meta": {"year": "March 2026", "tools": "Premiere Pro, After Effects, DaVinci Resolve, Acrylic Paint", "category": "Production Design", "collaboration": "Classroom Project"},
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": []
    },
    {
      // how this site was made. Written in tools/making.py (from the user's own write-up), pictures by tools/build_making.py
      "id": "making",
      "featured": false, "home": true,
      "title": "The Ride",
      "line": "Line 6",
      "blurb": "Turning my portfolio into a place you walk through",
      "shape": "wide",
      "band": "#FFC24A",
      "cover": "assets/projects/making/shot-hero.webp",
      "source": "index.html",
      "sourceLabel": "Take the ride",
      "intro": "I turned my portfolio from a page of project cards into a night walk through an Indian city, so the site itself shows how I design.",
      "lead": "A portfolio you walk through, with a plain view for anyone in a hurry. Scrolling moves a small version of me through one night in an Indian city, and each place is a section: projects on subway billboards, reels in a cinema, photos in a gallery, contact on a rooftop. I set the concept, the experience and the art direction, and made every call; Claude Code wrote the code and an image model drew the art to my brief.",
      "meta": {"year": "2026", "timeframe": "8 Days", "tools": "Claude, Claude Code, AI image generation", "category": "UI/UX", "collaboration": "Solo Project"},
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": []
    },
    // two pieces of work under NDA. nda: true = the page shows only the cover and a note; nothing of the work
    // itself is in the project. Covers are pixelated and stamped by tools/build_nda.py.
    {
      "id": "please-see",
      "featured": false, "nda": true,
      "title": "Please See x Anish Shah",
      "line": "Line 7",
      "blurb": "Internship work, under NDA",
      "shape": "wide",
      "band": "#E8331F",
      "cover": "assets/projects/nda/please-see.webp",
      "intro": "Work from my internship at Please See.",
      "lead": "This work is under a non-disclosure agreement, so I can’t show it here. I’m happy to walk through my role and process in a conversation.",
      "meta": {"category": "Internship", "collaboration": "Please See"},
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": []
    },
    {
      "id": "miso",
      "featured": false, "nda": true,
      "title": "Miso.Inc x Anish Shah",
      "line": "Line 8",
      "blurb": "Website design, under NDA",
      "shape": "wide",
      "band": "#E8B81F",
      "cover": "assets/projects/nda/miso.webp",
      "intro": "A website design project with Miso.Inc.",
      "lead": "This work is under a non-disclosure agreement, so I can’t show it here. I’m happy to walk through my role and process in a conversation.",
      "meta": {"category": "UI/UX", "collaboration": "Miso.Inc"},
      "outcome": [],   // TODO (Anish): outcome and learnings, 2 to 4 short paragraphs; the page shows the block only when this has text
      "blocks": []
    }
  ],

  /* Cinema reels. Add `src: "media/reel.mp4"` to play a real file. */
  reels: [
    // the user's own films (sent 2026-10-08), re-encoded for the web from 1080p masters: 1920 wide, about 5 Mbit/s
    { id: "fort", title: "Fort", length: "0:25", poster: "assets/reels/fort.webp", src: "assets/reels/fort.mp4" },
    { id: "marine-drive", title: "Marine Drive", length: "0:42", poster: "assets/reels/marine-drive.webp", src: "assets/reels/marine-drive.mp4" },
    { id: "udaipur", title: "Udaipur", length: "0:29", poster: "assets/reels/udaipur.webp", src: "assets/reels/udaipur.mp4" },
  ],


  /* Exhibition photos. w/h is the aspect ratio of the photo. */
  /* Exhibition photos (4, one per frame). Frame 2 is portrait, the others landscape. */
  photos: [
    // the user's own photographs of Jodhpur (sent 2026-10-08), as an album
    { title: "Jodhpur", w: 3, h: 2, src: "assets/photos/jodhpur/01.webp", cover: "assets/photos/jodhpur/24.webp",
      album: Array.from({ length: 25 }, (_, i) => `assets/photos/jodhpur/${String(i + 1).padStart(2, "0")}.webp`) },
    // an album: one frame in the gallery, every picture in the viewer that opens from it. In the frame it shows
    // one picture, `cover` (default: src), chosen because its shape is close to that frame's, so little is cut off;
    // `pos` says which part to keep.
    // The street portraits from the Photography section of anishah.framer.website/about-me
    { title: "Street Portraits", w: 4, h: 5, src: "assets/photos/street-portraits/01.webp", cover: "assets/photos/street-portraits/03.webp",
      album: Array.from({ length: 11 }, (_, i) => `assets/photos/street-portraits/${String(i + 1).padStart(2, "0")}.webp`) },
    // the user's photographs of friends (sent 2026-10-08), as an album
    { title: "Friends", w: 3, h: 2, src: "assets/photos/friends/01.webp", cover: "assets/photos/friends/01.webp", pos: "50% 45%",
      album: Array.from({ length: 20 }, (_, i) => `assets/photos/friends/${String(i + 1).padStart(2, "0")}.webp`) },
    // "Second Chance", a short film the user directed: its poster, the shoot, the screenings (sent 2026-10-08).
    // feature: true gives the first picture (the poster) a large column of its own beside the grid.
    // 04, 05 and 07 are clips from the set, as silent looping animated WebP.
    { title: "Second Chance", note: "Short film", w: 3, h: 2, src: "assets/photos/second-chance/02.webp", cover: "assets/photos/second-chance/02.webp", pos: "50% 55%", feature: true,
      album: ["poster", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((n) => `assets/photos/second-chance/${n}.webp`) },
  ],
};
