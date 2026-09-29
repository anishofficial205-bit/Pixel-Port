/* ------------------------------------------------------------------
   SITE CONTENT — everything here is placeholder.
   Swap text, links and media as the real content comes in.
   Images use picsum.photos seeds until real work is added.
------------------------------------------------------------------- */
window.SITE = {
  name: "ANISH",
  role: "Visual & Product Designer",
  intro: "Hi! I design things for screens and streets. Scroll down, chalo, let's go on a ride through my work.",
  location: "Mumbai, India",
  email: "hello@example.com",
  year: new Date().getFullYear(),

  socials: [
    { label: "LinkedIn", short: "in", url: "#" },
    { label: "Instagram", short: "ig", url: "#" },
    { label: "Behance", short: "be", url: "#" },
    { label: "Dribbble", short: "dr", url: "#" },
  ],

  /* Subway billboards (4). shape: "wide" (metal frame, ~2:1 window) or "tall" (cyan LED, ~9:17 window) */
  projects: [
    {
      id: "chai-co",
      title: "Chai Co.",
      line: "Line 1",
      blurb: "Brand identity for a neighbourhood chai startup",
      year: "2026", role: "Brand Designer", tools: "Figma, Illustrator",
      shape: "wide", band: "#FF3D9A",
      image: "https://picsum.photos/seed/pp-chai/1280/720",
    },
    {
      id: "metro-app",
      title: "Metro Mate",
      line: "Line 2",
      blurb: "Ticketing app redesign for daily commuters",
      year: "2025", role: "Product Designer", tools: "Figma, Protopie",
      shape: "tall", band: "#3DF2FF",
      image: "https://picsum.photos/seed/pp-metro/720/1280",
    },
    {
      id: "kala",
      title: "Kala Fest",
      line: "Line 3",
      blurb: "Festival campaign and wayfinding system",
      year: "2025", role: "Visual Designer", tools: "After Effects, Figma",
      shape: "wide", band: "#FF9933",
      image: "https://picsum.photos/seed/pp-kala/1200/900",
    },
    {
      id: "dabba",
      title: "Dabba",
      line: "Line 4",
      blurb: "Design system for a lunch-delivery platform",
      year: "2024", role: "Design Systems", tools: "Figma, Storybook",
      shape: "wide", band: "#2F8F3E",
      image: "https://picsum.photos/seed/pp-dabba/1280/720",
    },
  ],

  /* Cinema reels. Add `src: "media/reel.mp4"` to play a real file. */
  reels: [
    { id: "showreel", title: "Showreel 2026", length: "1:30", poster: "https://picsum.photos/seed/pp-reel1/1280/720", src: null },
    { id: "motion", title: "Motion Bits", length: "0:45", poster: "https://picsum.photos/seed/pp-reel2/1280/720", src: null },
    { id: "brand-films", title: "Brand Films", length: "2:10", poster: "https://picsum.photos/seed/pp-reel3/1280/720", src: null },
  ],

  /* Exhibition photos. w/h is the aspect ratio of the photo. */
  photos: [
    { title: "Marine Drive", place: "Mumbai", year: "2026", w: 3, h: 2, src: "https://picsum.photos/seed/pp-ph1/1200/800" },
    { title: "Chor Bazaar", place: "Mumbai", year: "2025", w: 4, h: 5, src: "https://picsum.photos/seed/pp-ph2/960/1200" },
    { title: "Ghats at Dawn", place: "Varanasi", year: "2025", w: 3, h: 2, src: "https://picsum.photos/seed/pp-ph3/1200/800" },
    { title: "Blue Door", place: "Jodhpur", year: "2024", w: 1, h: 1, src: "https://picsum.photos/seed/pp-ph4/1000/1000" },
    { title: "Local Train", place: "Mumbai", year: "2024", w: 4, h: 5, src: "https://picsum.photos/seed/pp-ph5/960/1200" },
    { title: "Tea Estate", place: "Munnar", year: "2023", w: 3, h: 2, src: "https://picsum.photos/seed/pp-ph6/1200/800" },
  ],
};
