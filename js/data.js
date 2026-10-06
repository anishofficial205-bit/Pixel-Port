/* ------------------------------------------------------------------
   SITE CONTENT — everything here is placeholder.
   Swap text, links and media as the real content comes in.
   Images use picsum.photos seeds until real work is added.
------------------------------------------------------------------- */
window.SITE = {
  // Framer-hosted image at a sensible size (GIFs are served as-is so they keep animating)
  featured() { return this.projects.filter((p) => p.featured); },
  img(id, size = 2048) {
    if (id.includes("/")) return id;                       // a local file, e.g. assets/ads/…
    const u = "https://framerusercontent.com/images/" + id;
    return /\.gif$/i.test(id) ? u : u + "?scale-down-to=" + size;
  },

  name: "ANISH",
  role: "Visual & Product Designer",
  intro: "Hi! I design things for screens and streets. Scroll down, chalo, let's go on a ride through my work.",
  location: "Mumbai, India",
  email: "anishofficial205@email.com",              // as on anishah.framer.website
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
     cover/hero/img values are Framer image ids; SITE.img() turns them into sized URLs.
     blocks: {h} heading, {p} paragraph, {img,w,h} image, {list:[[title, text]]} feature list.
     ads (optional): what the street billboards show, per board shape: wide (~2.5:1) and tall (~1:2.2).
       Framer ids or local paths; animated WebP/GIF work. Without it the cover is used. Images are never
       cropped: they fit whole, over a pixelated copy of the cover. */
  projects: [
    {
      "id": "thrive",
      "featured": true,
      "ads": {"wide": ["assets/ads/thrive-logo.webp"], "tall": ["dp3u20lqd2b8MqVvTOntq9Bvb54.png"]},
      "title": "Thrive",
      "line": "Line 1",
      "blurb": "Brand identity for eco-friendly desk accessories",
      "shape": "wide",
      "band": "#3DF2FF",
      "cover": "dp3u20lqd2b8MqVvTOntq9Bvb54.png",
      "source": "https://anishah.framer.website/thrive",
      "intro": "Design a brand for a company that makes stylish desk accessories. The brand should feel creative, eco-friendly, and perfect for modern workspaces.",
      "lead": "Thrive brings a refined, minimalist visual identity to modern workspaces, transforming functional desk accessories into a cohesive, premium yet accessible experience that reflects clarity, intention, and everyday productivity.",
      "meta": {
        "year": "2024",
        "timeframe": "3 Weeks",
        "tools": "Photoshop, Illustrator, Blender",
        "category": "Branding",
        "collaboration": "Individual Project"
      },
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
          "img": "ZXVw8IzxIRNgEd4tVZiLfPJMu3Y.gif",
          "w": 1400,
          "h": 70
        },
        {
          "img": "Q2O7X1dwIY3eJYXmhF9OR4yBxaM.png",
          "w": 1587,
          "h": 1060
        },
        {
          "img": "ToNqXPbOGbC4TA3jC4kiHiPzmBY.png",
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
          "img": "uSHMFiPF7n22w4VCz2JBXyY.gif",
          "w": 1400,
          "h": 359
        },
        {
          "img": "69h8BsAsHowI6GZmXdphfqENhGw.png",
          "w": 22773,
          "h": 5689
        },
        {
          "img": "9wuysO25VIMSyaQafMQBPj8UMw.png",
          "w": 1400,
          "h": 450
        },
        {
          "img": "pC0latKXXwpX6phislJJDSXTQhk.png",
          "w": 1400,
          "h": 450
        },
        {
          "img": "Mq9jAwBPsP73qfgREBqBpimVyQ.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "52C3ACJWE1jZTazAgPxcB2MC7sM.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "Plyy5YyVSZa6jpGMPjo6c8ntL64.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "U8XgAV2tHVn8sa15J0gi92NejMM.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "MQ28P43pgkM0rW5YIFf0Pw4rR3w.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "2XbzuMshJWGQyqHWD7086yrgpM.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "00bC59XvIb9KcHLhwrsAjQ1pjg.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "L1j7lh3H0bvP5GVvkoyz1nPtbVo.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "Q6HmzROfxSmBDHhaEwHrox4TcJs.png",
          "w": 1920,
          "h": 1080
        },
        {
          "img": "0Kjd1mgBshw6bJnRX5lFymLXO8A.png",
          "w": 1920,
          "h": 1080
        },
        {
          "h": "Colour"
        },
        {
          "p": "The color palette for Thrive uses muted teal tones that feel modern and naturally grounded. Chosen to convey calm, clarity, and subtle luxury, the deeper teal adds depth and sophistication while the lighter tone brings balance and softness. Together, they create a clean, refined aesthetic that reflects Thrive’s affordable premium workspace identity."
        },
        {
          "img": "wnQbvHpWhf9LQ5YFNSFSXWlzHw.gif",
          "w": 1400,
          "h": 200
        },
        {
          "img": "g8DTqGfDLMdYofaglikIOpTxr8.png",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "0tqG4YIXAgoHrb3nzjHnFwcwN2A.png",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "3JbzeH173rbbqdLbSus13vQ1xM.png",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "OyVQfHCg1xSYDP76qWfNLZqIL1U.png",
          "w": 4032,
          "h": 3024
        },
        {
          "img": "WRd0WtkT5NWSFr3AQRxMOgb1I.png",
          "w": 4032,
          "h": 3024
        },
        {
          "h": "Products"
        },
        {
          "p": "To explore how Thrive could exist in the real world, I recreated market products in Blender and applied the brand’s logo and colors. This helped me understand how the identity translates onto physical forms while experimenting with 3D. Alongside this, I created product sketches to study proportions, materials, and design directions. Together, the sketches and renders helped bring Thrive closer to a tangible workspace experience."
        },
        {
          "img": "ImOlC6EPYzz5AQHdQ7Ye8roO04.png",
          "w": 4000,
          "h": 3000
        },
        {
          "img": "Ivsfxoqci6HtqlDeMC2pRzJN9eY.png",
          "w": 4000,
          "h": 3000
        },
        {
          "img": "wvnv1XRNUWuiNeSgJY88E7fCVc.png",
          "w": 4500,
          "h": 2812
        },
        {
          "img": "sYGxD28KW5eV7ywhtrx0asqKlx8.png",
          "w": 5472,
          "h": 3635
        },
        {
          "img": "az8gvZNx8xMnj1O4o2zCpZQYNE.png",
          "w": 4184,
          "h": 2414
        },
        {
          "img": "VniLMVclzWG5ighVsmhIOqgt9G4.png",
          "w": 4500,
          "h": 3500
        },
        {
          "img": "YxvxppiVXI7dojejjKAlumkcOA.png",
          "w": 4500,
          "h": 3003
        },
        {
          "img": "QkBuyGtVnuTDn5aCemY5jtujOg.png",
          "w": 4092,
          "h": 2880
        },
        {
          "img": "503oXYqYxolCDceo29aB43C18s.png",
          "w": 5000,
          "h": 3336
        },
        {
          "img": "y2zmsRLD3hsmCrHRKCc8U2qmOPs.png",
          "w": 2497,
          "h": 1637
        }
      ]
    },
    {
      "id": "krumble",
      "featured": true,
      "ads": {"wide": ["HsNegKWzgrPy1KGooo5JW61CxJo.png"], "tall": ["HvvrYLL9E86iUDCiPFUmJzYsKpU.png", "Fcppa449wpWVPOvtSgmSMZG1k.png"]},
      "title": "Krumble",
      "line": "Line 2",
      "blurb": "Festive gift packaging for Haldiram’s cookies",
      "shape": "tall",
      "band": "#FF3D9A",
      "cover": "HvvrYLL9E86iUDCiPFUmJzYsKpU.png",
      "hero": "HsNegKWzgrPy1KGooo5JW61CxJo.png",
      "source": "https://anishah.framer.website/krumble",
      "intro": "A packaging design project reimagining Haldiram’s cookies as a premium, festive-ready gifting experience.",
      "lead": "In India, cookies rarely make good gifts because their packaging seems too plain and functional. I reimagined Haldiram’s cookies as a festive gift, transforming a familiar product into a special keepsake for celebrations.",
      "meta": {
        "year": "2025",
        "timeframe": "3 Weeks",
        "tools": "Photoshop, Illustrator",
        "category": "Packaging",
        "collaboration": "Individual Project"
      },
      "blocks": [
        {
          "img": "ipjn6J5d284ShEM4Gcr6ygAWh4I.png",
          "w": 2528,
          "h": 1696
        },
        {
          "img": "KC3d3gJ7UeanWqRuRShQo38QY.png",
          "w": 1746,
          "h": 1513
        },
        {
          "h": "The problem"
        },
        {
          "p": "The existing Haldiram’s cookie packaging is functional but not memorable. Most designs rely on busy colours, flat layouts, and a strong focus on product display, which works for everyday retail but falls short for gifting. They lack warmth, presence, and a sense of occasion, making the experience feel transactional rather than celebratory. This absence of emotion and visual hierarchy created an opportunity to rethink the packaging as something more thoughtful and gift worthy."
        },
        {
          "img": "oBjMqgJSOp2z1VFzyoTtCtZS3I.jpeg",
          "w": 2757,
          "h": 3873
        },
        {
          "img": "5TxZ8bmT4X0yHr6bYgDg9IvaQbM.jpeg",
          "w": 2611,
          "h": 3835
        },
        {
          "img": "zaOWgxF0BVJ3ltCFOqB7vqkYNU.jpeg",
          "w": 2761,
          "h": 3867
        },
        {
          "h": "Sketches"
        },
        {
          "p": "These sketches marked the starting point of the project, where I studied existing cookie packaging and identified gaps such as repetitive structures, plastic heavy formats, and a lack of user experience or sense of occasion. By sketching current systems alongside new ideas, I explored silhouettes, opening mechanisms, materials, and more intentional forms. This phase focused on reimagining the cookie box as premium and gift worthy, laying the foundation for the final packaging structure."
        },
        {
          "img": "ZjxXNCTb8vzueAE8Xivo4rWmk.png",
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
          "img": "a5bqlwAD0CEDCSJDGz8J1LVlyg.jpg",
          "w": 23385,
          "h": 16535
        },
        {
          "h": "Material"
        },
        {
          "p": "To ensure the cookies remain intact from shelf to celebration, the packaging utilizes Rigid Chipboard. This choice provides superior structural integrity and impact resistance, ensuring that premium aesthetics are matched by a breakage-free experience."
        },
        {
          "img": "Fcppa449wpWVPOvtSgmSMZG1k.png",
          "w": 1696,
          "h": 2528
        },
        {
          "img": "HvvrYLL9E86iUDCiPFUmJzYsKpU.png",
          "w": 1696,
          "h": 2528
        },
        {
          "img": "D1pRJVSG6433hAomt9eGpUdHA.png",
          "w": 1928,
          "h": 1696
        },
        {
          "img": "wNKgGgtwD1obs90KvtYM2eXrBNE.png",
          "w": 1748,
          "h": 1240
        }
      ]
    },
    {
      "id": "parde-ke-peeche",
      "featured": true,
      "ads": {"wide": ["assets/ads/parde-logo.webp"], "tall": ["EQutebwwanZebgWET9rGUdtuOrY.png"]},
      "title": "Parde Ke Peeche",
      "line": "Line 3",
      "blurb": "A magazine on the craft behind Bollywood",
      "shape": "wide",
      "band": "#FF9933",
      "cover": "EQutebwwanZebgWET9rGUdtuOrY.png",
      "hero": "jKbW15pOCyOKgnwzV0fDkMba6hs.png",
      "source": "https://anishah.framer.website/parde-ke-peeche",
      "intro": "A publication design project exploring the unseen craft, design, and storytelling behind Bollywood.",
      "lead": "Parde Ke Peeche is a 20-page publication I designed as part of my communication design program. The magazine explores the hidden craftsmanship of Bollywood like cinematography, sound design, choreography, set design, poster art, and motion titles. Instead of focusing on celebrity culture, the publication celebrates the people and processes that shape the visual experience of Indian cinema.",
      "meta": {
        "year": "2025",
        "timeframe": "2 Weeks",
        "tools": "InDesign, Photoshop",
        "category": "Publication Design"
      },
      "blocks": [
        {
          "img": "JOKsFJWZvQaIBHXgkL2YAw0jcA0.png",
          "w": 5000,
          "h": 3335
        },
        {
          "h": "Grid"
        },
        {
          "p": "Most of the magazine is built using 2-column and 3-column grids, which gave the layouts a balanced, readable structure while still allowing room for cinematic visual pacing. These grids form the core of the publication’s rhythm and tight enough to hold long-form content comfortably, but flexible enough to pair with full-bleed images, asymmetrical compositions, and occasional single-column moments. While the overall system is anchored in these two grids, a few spreads intentionally break out of them for visual impact, creating a mix of consistency and expressive variation throughout the magazine."
        },
        {
          "img": "4Umpu6Ucboqnepf3hhR6zYL72BY.png",
          "w": 3810,
          "h": 2710
        },
        {
          "h": "Spreads"
        },
        {
          "img": "C6Hu12Ur3Ya4EI8JZJ8f8SdaN0E.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "dD0cL4WVN4R0uotzgtjBZ2BTM.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "9KqvKYQnd6j6XjGqjgtb1jCOY0A.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "7FU3vsaJLyqoHuKvr15i6ElnWE.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "0V0rejRTrkkBB9xQsMQW0HUSZQI.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "Xu0leYFA3g6GU1rfOaB3QwksXME.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "QKetloW9mXwM3ZcCqjRNeFhiTf0.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "SsQPsXJwC6jvIZX0qj0ytOUVukA.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "jhmtRTO7Sw9tyekDA9E8XVy6AnE.png",
          "w": 4320,
          "h": 2580
        },
        {
          "img": "sds7kSIsbo9RHTU0E9BmQT6cRFU.gif",
          "w": 1400,
          "h": 422
        }
      ]
    },
    {
      "id": "haven",
      "featured": true,
      "ads": {"wide": ["hbqzZsFb5sUFuO3g55Xm4b7K80.png"], "tall": ["hbqzZsFb5sUFuO3g55Xm4b7K80.png"]},
      "title": "Haven",
      "line": "Line 4",
      "blurb": "A safe space to learn and practise consent",
      "shape": "wide",
      "band": "#FFC21A",
      "cover": "hbqzZsFb5sUFuO3g55Xm4b7K80.png",
      "source": "https://anishah.framer.website/haven",
      "intro": "A UI/UX project exploring consent as a lived experience for Indian adolescents, designing culturally sensitive ways to practice boundaries across social, digital, and intimate spaces.",
      "lead": "This project explores consent as a lived experience for Indian youth, revealing gaps between awareness and action shaped by culture and power. It proposes a confidential digital platform that blends expert guidance, peer dialogue, and scenario-based learning to help young people practice boundaries and build respectful relationships.",
      "meta": {
        "year": "2025",
        "timeframe": "6 Weeks",
        "tools": "Figma, Perplexity",
        "category": "UI/UX",
        "collaboration": "Individual Project"
      },
      "blocks": [
        {
          "img": "9kkbh8nwlQ9wbuDQxoExiAxUzAE.png",
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
          "img": "awiCnSft6M5A6MonB4OVY0We1T4.jpeg",
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
          "img": "IMTJSMdLd1zq3fcZs5UaBRf4o.jpeg",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "OpkqF7XXLDsmapo3I6sr8wgEw.jpeg",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "IIYiQDbtqvqmTISAZqSZqEQbgCI.jpg",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "yskQhiDNYUmAIrJ3zGcmIOiXa9c.jpeg",
          "w": 5712,
          "h": 4284
        },
        {
          "img": "pfsgaW4qYBNXBmxuHcXvnOY7U5E.jpeg",
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
          "img": "eJp9yvPDTF7bmFFZDzA18pqjHA.jpeg",
          "w": 3653,
          "h": 2713
        },
        {
          "h": "How Might We"
        },
        {
          "p": "How might we create engaging and culturally relatable ways for Indian adolescents aged 16–22 to learn and practice consent beyond traditional education systems, so they can confidently assert boundaries and build respectful relationships across social, digital, and intimate spaces?"
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
          "img": "RTe9p4nEhQ7HXxOuWN0kwELTU.png",
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
          "p": "This project reimagines consent education through a human-centered UI/UX lens, treating consent not as a rule to be taught but as a skill to be practiced. By combining participatory research, culturally sensitive design, and emotionally safe interactions, the project bridges the gap between awareness and real-life behavior. Haven demonstrates how thoughtful design can create trust, encourage difficult conversations, and empower young people to navigate relationships with clarity, autonomy, and respect."
        }
      ]
    },
    {
      // from behance.net/gallery/248967119 (a team project). Its page is laid out in tools/build_flow.py; photos in assets/projects/bhayanaka
      "id": "bali",
      "featured": false,
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
      "blocks": []
    },
    {
      // how this site was made. Written in tools/making.py (from the user's own write-up), pictures by tools/build_making.py
      "id": "making",
      "featured": false,
      "title": "The Ride",
      "line": "Line 6",
      "blurb": "How this portfolio was built with Claude",
      "shape": "wide",
      "band": "#FFC24A",
      "cover": "assets/projects/making/shot-hero.webp",
      "source": "index.html",
      "sourceLabel": "Take the ride",
      "intro": "Building my portfolio with Claude: a side-scrolling night in an Indian city, where every place is a section of the site.",
      "lead": "My portfolio is a 2D side-scrolling game. A small version of me walks through one night in an Indian city, and every place he enters is a section of the site: projects on subway billboards, reels in a single-screen cinema, photography in a gallery, and contact details on a rooftop. I wrote no code by hand. My role was game designer and art director: inventing the world, then writing prompts precise enough for Claude Code to build it and an image model to draw it.",
      "meta": {"year": "2026", "timeframe": "8 Days", "tools": "Claude, Claude Code, AI image generation", "category": "Process", "collaboration": "Individual Project"},
      "blocks": []
    }
  ],

  /* Cinema reels. Add `src: "media/reel.mp4"` to play a real file. */
  reels: [
    { id: "showreel", title: "Showreel 2026", length: "1:30", poster: "https://picsum.photos/seed/pp-reel1/1280/720", src: null },
    { id: "motion", title: "Motion Bits", length: "0:45", poster: "https://picsum.photos/seed/pp-reel2/1280/720", src: null },
    { id: "brand-films", title: "Brand Films", length: "2:10", poster: "https://picsum.photos/seed/pp-reel3/1280/720", src: null },
  ],

  /* Exhibition photos. w/h is the aspect ratio of the photo. */
  /* Exhibition photos (4, one per frame). Frame 2 is portrait, the others landscape. */
  photos: [
    { title: "Marine Drive", place: "Mumbai", year: "2026", w: 3, h: 2, src: "https://picsum.photos/seed/pp-ph1/1200/800" },
    { title: "Chor Bazaar", place: "Mumbai", year: "2025", w: 4, h: 5, src: "https://picsum.photos/seed/pp-ph2/960/1200" },
    { title: "Ghats at Dawn", place: "Varanasi", year: "2025", w: 3, h: 2, src: "https://picsum.photos/seed/pp-ph3/1200/800" },
    { title: "Tea Estate", place: "Munnar", year: "2023", w: 3, h: 2, src: "https://picsum.photos/seed/pp-ph6/1200/800" },
  ],
};
