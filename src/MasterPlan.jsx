import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import PlantCam from "./PlantCam.jsx";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FROST_DATE = "May 15";

// ─── TIMELINE DATA ───
// range: [startMonth, startDay, endMonth, endDay] (1-indexed months, year assumed 2026)
const timeline = [
  {
    date: "Feb 23",
    range: [2,23,2,28],
    urgency: "NOW",
    color: "#dc2626",
    tasks: [
      { type: "indoor", plant: "🌶️ Scotch Bonnet Pepper", sku: "", detail: "Heat mat 80–85°F. SLOW germinator (10–21 days). Sow ¼\" deep in seed starting mix. Keep moist." },
      { type: "indoor", plant: "🌶️ Primo II Jalapeño Hybrid", sku: "#77718", detail: "Heat mat 80°F. Germination 7–14 days. Sow ¼\" deep." },
      { type: "indoor", plant: "🥬 Cimarron Romaine Lettuce", sku: "#85103", detail: "Optional but recommended. NO heat mat — prefers cool 60–70°F. Sow surface/barely cover. Germination 8–10 days." },
    ]
  },
  {
    date: "Mar 2–9",
    range: [3,2,3,9],
    urgency: "NEXT WEEK",
    color: "#2563eb",
    tasks: [
      { type: "indoor", plant: "🥬 Kale", sku: "", detail: "Sow ¼\" deep, 65–75°F. Germination 5–7 days. Transplant outdoors mid-April." },
      { type: "indoor", plant: "🥬 Kohlrabi", sku: "", detail: "Sow ¼\" deep, 65–75°F. Germination 5–10 days. Transplant outdoors mid-April." },
    ]
  },
  {
    date: "Mar 15–Apr 1",
    range: [3,15,4,1],
    urgency: "DIRECT SOW",
    color: "#7c3aed",
    tasks: [
      { type: "outdoor", plant: "❄️ Avalanche Snow Peas", sku: "#76100", detail: "FIRST THING IN THE GROUND. Direct sow 1\" deep, 2–3\" apart. Fence strip right end + shade zone double row. Frost-tolerant — soil just needs to be 40°F+ and workable." },
    ]
  },
  {
    date: "Mar 16–23",
    range: [3,16,3,23],
    urgency: "TOMATO WEEK",
    color: "#f59e0b",
    tasks: [
      { type: "indoor", plant: "🍅 Heirloom Rainbow Blend", sku: "#73592", detail: "Sow ¼\" deep, 70–80°F. Germination 7–10 days. Indeterminate mix. Start 4–6 seeds, keep best 2." },
      { type: "indoor", plant: "🍅 San Marzano", sku: "#85963", detail: "Sow ¼\" deep, 70–80°F. Germination 7–10 days. Determinate paste tomato. Start 3–4 seeds, keep best 1." },
      { type: "indoor", plant: "🍅 Chocolate Cherry", sku: "#80652", detail: "Sow ¼\" deep, 70–80°F. Germination 7–10 days. Indeterminate cherry. Start 4–6 seeds, keep best 2 (1 for fence, 1 for pot)." },
    ]
  },
  {
    date: "Mar 30–Apr 6",
    range: [3,30,4,6],
    urgency: "BASIL WEEK",
    color: "#f59e0b",
    tasks: [
      { type: "indoor", plant: "🌿 Sweet Basil", sku: "#14602", detail: "Sow surface/barely cover, 70°F+. Germination 7–10 days. Start 8–10 seeds, keep best 5–6. Grows FAST — don't start earlier." },
    ]
  },
  {
    date: "Late Mar – Early Apr",
    range: [3,25,4,7],
    urgency: "SOIL PREP",
    color: "#78716c",
    tasks: [
      { type: "outdoor", plant: "🔧 TILL & AMEND ALL BEDS", sku: "", detail: "Water soil 48 hrs before. Break crust with spade. Run Mantis tiller in multiple passes. Spread 3–4\" compost + gypsum + lime + Garden-Tone. Till again to mix. This is when your $97 amendment budget gets spent." },
    ]
  },
  {
    date: "Apr 1–15",
    range: [4,1,4,15],
    urgency: "BUZZ BUTTONS",
    color: "#f59e0b",
    tasks: [
      { type: "indoor", plant: "⚡ Buzz Button (Acmella oleracea)", sku: "", detail: "Surface sow — needs light to germinate. 70–76°F (heat mat helps). Germination 7–10 days. Tropical plant, frost-tender. Start 6–8 seeds, keep best 3–4." },
    ]
  },
  {
    date: "Apr 6–13",
    range: [4,6,4,13],
    urgency: "ZINNIA WEEK",
    color: "#f59e0b",
    tasks: [
      { type: "indoor", plant: "🌸 Zinnia Pumila (Semi-Dwarf)", sku: "", detail: "Sow ¼\" deep, 65–70°F. NO heat mat. Use peat pots or large cells — zinnias hate root disturbance. Germination 7–10 days. OR just direct sow after May 18 (easier)." },
    ]
  },
  {
    date: "Apr 6–20",
    range: [4,6,4,20],
    urgency: "TRANSPLANT",
    color: "#0d9488",
    tasks: [
      { type: "outdoor", plant: "🥬 Kale → shade zone", sku: "", detail: "Harden off 7 days. Transplant 12–15\" apart staggered pattern. Frost-tolerant." },
      { type: "outdoor", plant: "🥬 Kohlrabi → shade zone", sku: "", detail: "Harden off 7 days. Transplant 6–8\" apart. Harvest at 2–3\" diameter." },
      { type: "outdoor", plant: "🥬 Cimarron Romaine → shade zone", sku: "#85103", detail: "Harden off 5–7 days. Transplant 12\" apart. Partial shade prevents bolting." },
    ]
  },
  {
    date: "Apr 13–20",
    range: [4,13,4,20],
    urgency: "CUCUMBER",
    color: "#f59e0b",
    tasks: [
      { type: "indoor", plant: "🥒 Americana Cucumber", sku: "#70077", detail: "Sow ½\" deep in peat pots (hates root disturbance). 70–80°F. Germination 8–10 days. Start 4–5 seeds, keep best 2. OR direct sow after May 18." },
    ]
  },
  {
    date: "Apr 15–May 15",
    range: [4,15,5,15],
    urgency: "DIRECT SOW",
    color: "#7c3aed",
    tasks: [
      { type: "outdoor", plant: "🌿 Dill Delight", sku: "#70010", detail: "Direct sow ¼–½\" deep, thin to 8\" apart. Sunny strip + main plot near peppers. Only 40 days to harvest! Succession sow every 3 weeks." },
    ]
  },
  {
    date: "Apr 20–27",
    range: [4,20,4,27],
    urgency: "SQUASH",
    color: "#f59e0b",
    tasks: [
      { type: "indoor", plant: "🎃 Black Magic Zucchini", sku: "#15033", detail: "Sow ½\" deep in peat pots. 70–80°F. Grows EXPLOSIVELY fast. Only 25 seeds in packet — don't waste them. Start 3–4, keep best 1. OR direct sow after May 18." },
    ]
  },
  {
    date: "May 5–14",
    range: [5,5,5,14],
    urgency: "HARDEN OFF",
    color: "#78716c",
    tasks: [
      { type: "outdoor", plant: "🔧 HARDEN OFF ALL WARM-SEASON SEEDLINGS", sku: "", detail: "Move trays outside for 1–2 hrs Day 1 (shade), increase daily. By Day 7–10 they should handle full sun all day. Bring in if frost threatened. This step is NON-NEGOTIABLE — skipping it kills transplants." },
    ]
  },
  {
    date: "May 18–25",
    range: [5,18,5,25],
    urgency: "THE BIG PLANT-OUT",
    color: "#0d9488",
    tasks: [
      { type: "outdoor", plant: "🍅 Rainbow Blend → main plot back row", sku: "#73592", detail: "2 plants, 24–30\" apart. Bury stems deep. Cage immediately." },
      { type: "outdoor", plant: "🍅 San Marzano → fence strip center", sku: "#85963", detail: "1 plant, caged. Determinate, 4–5 ft." },
      { type: "outdoor", plant: "🍅 Chocolate Cherry → fence strip center + 20\" pot", sku: "#80652", detail: "2 plants. Tie fence plant to trellis. Cage pot plant." },
      { type: "outdoor", plant: "🌶️ Scotch Bonnet → main plot 2nd row", sku: "", detail: "1 plant, center position, 18–24\" from jalapeños." },
      { type: "outdoor", plant: "🌶️ Primo II Jalapeño → main plot + 20\" pot", sku: "#77718", detail: "2–3 ground + 1 pot. Space 18–24\" apart." },
      { type: "outdoor", plant: "🌿 Sweet Basil → main plot + sunny strip + pots", sku: "#14602", detail: "5–6 plants distributed. Companion with tomatoes. Pinch at 6\" tall." },
      { type: "outdoor", plant: "🥒 Americana Cucumber → fence strip", sku: "#70077", detail: "2 plants, 24\" apart. Train up fence twine. Soft ties." },
      { type: "outdoor", plant: "🎃 Black Magic Zucchini → fence strip", sku: "#15033", detail: "1 plant. Tie main stem to fence every 6–8\". Use fabric sling for heavy fruit." },
      { type: "outdoor", plant: "🌸 Zinnia Pumila → borders/gaps", sku: "", detail: "Transplant seedlings or direct sow 8–12\" apart in any sunny leftover space." },
      { type: "outdoor", plant: "⚡ Buzz Button → sunny gaps/pots", sku: "", detail: "3–4 plants, 12–15\" apart. Full sun. Low mounding habit (12–24\"). Needs warm soil — don't rush. Works great in pots too." },
    ]
  },
  {
    date: "May 18–Jun 15",
    range: [5,18,6,15],
    urgency: "DIRECT SOW",
    color: "#7c3aed",
    tasks: [
      { type: "outdoor", plant: "🫘 Purple Queen Bush Beans", sku: "#39845", detail: "Direct sow 1\" deep, 2–3\" apart. Main plot sunny front edge. 51 days. Succession sow 2nd batch 2 weeks later." },
      { type: "outdoor", plant: "🫘 Kentucky Wonder Pole Beans", sku: "#14199", detail: "Direct sow 1–1.5\" deep, 4\" apart at base of fence. Left end of fence strip. Climbs 5–7 ft." },
    ]
  },
  {
    date: "Late Jun",
    range: [6,20,6,30],
    urgency: "RELAY",
    color: "#78716c",
    tasks: [
      { type: "outdoor", plant: "♻️ Peas die back → replace with fall beans or lettuce", sku: "", detail: "Pull spent pea vines (leave roots — nitrogen nodules feed next crop). Direct sow bush beans or more romaine in these spots." },
    ]
  },
  {
    date: "Late Jul",
    range: [7,20,7,31],
    urgency: "FALL CROPS",
    color: "#2563eb",
    tasks: [
      { type: "outdoor", plant: "🥬 Direct sow fall Kale + Kohlrabi", sku: "", detail: "Shade zone. These grow through fall and kale survives hard frost. Harvest into November." },
    ]
  },
  {
    date: "August",
    range: [8,1,8,31],
    urgency: "FALL CROPS",
    color: "#2563eb",
    tasks: [
      { type: "outdoor", plant: "🥬 Sow more Cimarron Romaine", sku: "#85103", detail: "Fall lettuce crop. Shade zone. Cooler September weather = perfect romaine conditions." },
    ]
  },
  {
    date: "May 13–25",
    range: [5,13,5,25],
    urgency: "FIRST HARVESTS",
    color: "#059669",
    tasks: [
      { type: "harvest", plant: "❄️ Avalanche Snow Peas", sku: "#76100", detail: "59 days from mid-March sow. Pick pods when flat and tender. Harvest daily to keep plants producing." },
      { type: "harvest", plant: "🌿 Dill Delight (first sowing)", sku: "#70010", detail: "40 days from mid-April sow. Snip leaves as needed. Will bolt in heat — succession sow." },
    ]
  },
  {
    date: "Jun 5–15",
    range: [6,5,6,15],
    urgency: "HARVEST",
    color: "#059669",
    tasks: [
      { type: "harvest", plant: "🥬 Cimarron Romaine", sku: "#85103", detail: "60–70 days from early April transplant. Cut whole head or harvest outer leaves." },
      { type: "harvest", plant: "🥬 Kohlrabi", sku: "", detail: "45–60 days from mid-April transplant. Harvest bulb at 2–3\" diameter before it gets woody." },
      { type: "harvest", plant: "🥬 Kale (first leaves)", sku: "", detail: "55–65 days from mid-April transplant. Harvest outer leaves continuously — plant keeps producing until hard frost." },
    ]
  },
  {
    date: "Jul 7–17",
    range: [7,7,7,17],
    urgency: "HARVEST",
    color: "#059669",
    tasks: [
      { type: "harvest", plant: "🎃 Black Magic Zucchini", sku: "#15033", detail: "50 days from May 18 transplant. Pick at 6–8\". Check DAILY — they explode in size." },
      { type: "harvest", plant: "🫘 Purple Queen Bush Beans", sku: "#39845", detail: "51 days from May 18 direct sow. Pick purple pods at 6\". Harvest frequently to keep producing." },
      { type: "harvest", plant: "🥒 Americana Cucumber", sku: "#70077", detail: "60 days from May 18. Pick at 8–10\" for slicing. Don't let them yellow on the vine." },
      { type: "harvest", plant: "🌿 Sweet Basil", sku: "#14602", detail: "Continuous harvest once plants are 6\"+ tall. Pinch stems above a leaf pair." },
    ]
  },
  {
    date: "Jul 24–Aug 1",
    range: [7,24,8,1],
    urgency: "HARVEST",
    color: "#059669",
    tasks: [
      { type: "harvest", plant: "🫘 Kentucky Wonder Pole Beans", sku: "#14199", detail: "67 days from May 18 direct sow. Pick 8–9\" pods. One sowing produces for weeks." },
      { type: "harvest", plant: "🍅 Chocolate Cherry Tomato", sku: "#80652", detail: "70 days from May 18 transplant. Pick when deep brick-red with chocolate shading. Your earliest tomato!" },
      { type: "harvest", plant: "🌶️ Primo II Jalapeño", sku: "#77718", detail: "70–75 days from May 18 transplant. Pick green at 3–4\" or let ripen to red for more heat." },
      { type: "harvest", plant: "⚡ Buzz Button (first flowers)", sku: "", detail: "60–70 days from May 18 transplant. Pick flower buds when plump and cone-shaped but before fully opening. Regular picking = more blooms through frost. Use fresh for max tingle." },
    ]
  },
  {
    date: "Aug 6–26",
    range: [8,6,8,26],
    urgency: "HARVEST",
    color: "#059669",
    tasks: [
      { type: "harvest", plant: "🍅 Heirloom Rainbow Blend", sku: "#73592", detail: "80–100 days from May 18 transplant. Color varies by variety in the mix. Pick when fully colored and slightly soft." },
      { type: "harvest", plant: "🍅 San Marzano", sku: "#85963", detail: "85 days from May 18 transplant. Determinate — most fruit ripens around the same time. Perfect for a big sauce day." },
    ]
  },
  {
    date: "Aug 16–Sep 15",
    range: [8,16,9,15],
    urgency: "HARVEST",
    color: "#059669",
    tasks: [
      { type: "harvest", plant: "🌶️ Scotch Bonnet", sku: "", detail: "90–120 days from May 18 transplant. Pick when fully colored (red/orange/yellow). Handle with gloves — 100k–325k Scoville." },
    ]
  },
];

function rangeStart(r) { return new Date(2026, r[0] - 1, r[1]); }
function rangeEnd(r) { return new Date(2026, r[2] - 1, r[3], 23, 59, 59); }

timeline.sort((a, b) => rangeStart(a.range) - rangeStart(b.range));

function isActiveNow(range) {
  if (!range) return false;
  const now = new Date();
  return now >= rangeStart(range) && now <= rangeEnd(range);
}

function categorizeTimeline() {
  const now = new Date();
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 14);
  const doNow = [], comingSoon = [], notYet = [];
  for (const entry of timeline) {
    if (!entry.range) continue;
    const start = rangeStart(entry.range);
    const end = rangeEnd(entry.range);
    if (now >= start && now <= end) doNow.push(entry);
    else if (start > now && start <= nextWeek) comingSoon.push(entry);
    else if (start > now) notYet.push(entry);
  }
  return { doNow, comingSoon, notYet };
}

function plantNames(entry) {
  return entry.tasks.map(t => t.plant.replace(/^[^\w]*/, '').replace(/ →.*/, '')).join(", ");
}

// ─── ZONE DATA ───
const zones = [
  {
    id: "fence",
    title: "🪵 Fence Strip — The Vertical Garden Wall",
    dims: '216" × 11" (18 ft long) · West-facing fence · Full afternoon sun',
    color: "#fef3c7",
    border: "#f59e0b",
    description: "Single row of plants at ground level, with vines trained UP the fence using horizontal twine lines at 12\", 24\", 36\", 48\", and 60\" heights.",
    sections: [
      {
        label: "LEFT END — Pole Beans (0–48\", 4 ft)",
        plants: "Kentucky Wonder Pole Beans (#14199)",
        count: "10–12 seeds",
        spacing: "4\" apart, 1–1.5\" deep",
        notes: "Direct sow after May 18. These climb 5–7 ft — they'll fill the fence beautifully. Run horizontal twine every 12\" up the fence. The beans will grab on themselves. Harvest 8–9\" pods in ~67 days. One sowing produces for weeks.",
        color: "#86efac"
      },
      {
        label: "LEFT-CENTER — Americana Cucumber (48–96\", 4 ft)",
        plants: "Americana Slicing Hybrid Cucumber (#70077)",
        count: "3–4 seeds (thin to 2 plants)",
        spacing: "24\" apart",
        notes: "Direct sow or transplant after May 18. TRAIN VERTICALLY — cucumbers love climbing and produce straighter fruit when hanging. Use soft ties or fabric strips to guide vines onto the twine. Vining type, glossy 8–10\" cukes. Huge yields from just 2 plants.",
        color: "#bbf7d0"
      },
      {
        label: "CENTER — Tomatoes (96–156\", 5 ft)",
        plants: "San Marzano (#85963) + 1 Chocolate Cherry (#80652)",
        count: "2 plants",
        spacing: "30\" apart",
        notes: "Transplant after May 18. San Marzano: determinate, 4–5 ft, cage it. Chocolate Cherry: indeterminate, will climb 5–6 ft — tie it to the fence as a living wall of cherry tomatoes. The west-facing fence radiates stored heat in the evening which tomatoes LOVE. Place the cherry tomato closer to the cucumber side for a nice transition of climbing plants.",
        color: "#fde68a"
      },
      {
        label: "RIGHT-CENTER — Black Magic Zucchini (156–204\", 4 ft)",
        plants: "Black Magic Zucchini (#15033)",
        count: "2 seeds (thin to 1 plant)",
        spacing: "1 plant, centered",
        notes: "Direct sow or transplant after May 18. Yes, you CAN train zucchini vertically! It's not a natural climber, but if you tie the main stem to the fence as it grows (every 6–8\"), the leaves fan out against the fence and the fruit hangs down. Saves massive ground space. Use a fabric sling for heavy fruit. Spreads 3.5 ft so give it this whole section.",
        color: "#d9f99d"
      },
      {
        label: "RIGHT END — Avalanche Snow Peas (204–216\", 1 ft + overflow)",
        plants: "Avalanche Snow Peas (#76100)",
        count: "15–20 seeds",
        spacing: "2–3\" apart",
        notes: "Direct sow mid-March to April 1 — these go in FIRST, weeks before everything else. They're frost-tolerant and only 30\" tall. They'll produce through May/June, then die back in the heat. After peas finish, you can plant a late succession of bush beans or more cucumbers in this spot. Short section is fine — peas also go in the main plot.",
        color: "#c7d2fe"
      }
    ],
    setupNote: "FENCE PREP (do this before planting): Screw in cup hooks or small eye screws every 24\" along the top of the fence, and at 12\" height intervals. Run horizontal jute twine or garden wire between them. This creates a simple trellis grid. Total cost: ~$5 in hardware. You can also use zip ties if the fence has gaps between boards."
  },
  {
    id: "main-sun",
    title: "☀️ Main Plot — Full Sun Zone (upper-left, ~66 sq ft)",
    dims: "The area NOT covered by the tree's 100\" shade arc",
    color: "#fef9c3",
    border: "#eab308",
    description: "This is your prime real estate. Tomatoes and peppers get priority here.",
    sections: [
      {
        label: "Back Row (along top edge) — Heirloom Tomatoes",
        plants: "Heirloom Rainbow Blend (#73592)",
        count: "2 plants",
        spacing: "24–30\" apart, 12\" from edge",
        notes: "Indeterminate, will grow to 5–6 ft. Cage with heavy-duty cages (NOT the flimsy cone ones — get the square/rectangular ones or make your own from concrete wire mesh). Place at the BACK so they don't shade everything else. You'll get a fun surprise mix of Brandywine, Cherokee Purple, Green Zebra, etc.",
        color: "#fde68a"
      },
      {
        label: "Second Row — Peppers",
        plants: "Scotch Bonnet + Primo II Jalapeño (#77718) + 1 more Jalapeño",
        count: "3–4 plants",
        spacing: "18–24\" apart, 36\" from tomatoes",
        notes: "Scotch Bonnet in the center (it needs the most heat and longest season). Jalapeños flanking it. All 30–36\" tall. These want the most sun you can give them — no shade from the tomatoes behind.",
        color: "#fed7aa"
      },
      {
        label: "Third Row — Basil + Dill companion herbs",
        plants: "Sweet Basil (#14602) + Dill Delight (#70010)",
        count: "2 basil + 2–3 dill",
        spacing: "Basil 18\" apart, dill 8\" apart",
        notes: "Basil between/near tomatoes and peppers — classic companion. Keep dill AWAY from tomatoes (poor companion) but near the peppers. Dill is 40 days to maturity — you'll be harvesting while the tomatoes are still growing. Succession sow dill every 3 weeks in any open spot.",
        color: "#bbf7d0"
      },
      {
        label: "Front Edge — Bush Beans",
        plants: "Purple Queen Improved (#39845)",
        count: "12–15 seeds",
        spacing: "2–3\" apart in a single row along the sunny front edge",
        notes: "Direct sow after May 18. Only 51 days — fastest bean you have. Gorgeous purple pods are easy to spot for harvesting. 24\" tall, won't shade anything behind them. Succession sow a second batch 2 weeks later if you have room.",
        color: "#c7d2fe"
      }
    ]
  },
  {
    id: "main-shade",
    title: "🌤️ Main Plot — Partial Shade Zone (lower-right, ~55 sq ft)",
    dims: "Inside the tree's 100\" shade arc — 4–5 hours sun",
    color: "#ecfdf5",
    border: "#10b981",
    description: "Cool-season crops and shade-tolerant greens thrive here. This zone is actually an ADVANTAGE — it stays cooler, extending your harvest for things that bolt in heat.",
    sections: [
      {
        label: "Pea Row — Along the shade boundary edge",
        plants: "Avalanche Snow Peas (#76100)",
        count: "30–40 seeds (you have ~225, plenty to spare)",
        spacing: "2–3\" apart in 2 close rows (they self-support!)",
        notes: "Direct sow mid-March. Place along the boundary between sun and shade — they get morning sun but afternoon shade keeps them cool and productive longer. The semi-leafless vines intertwine when planted in double rows. First harvest by May. After they die back in June heat, this space opens up for fall plantings.",
        color: "#c7d2fe"
      },
      {
        label: "Kale Block",
        plants: "Kale (your non-Gurney's seeds)",
        count: "4–6 plants",
        spacing: "12–15\" apart, staggered",
        notes: "Transplant mid-April. Kale is one of the MOST shade-tolerant vegetables. It actually tastes better with some shade (less bitter, slower to bolt). Harvest outer leaves continuously. Frost sweetens it — you'll be eating kale into November.",
        color: "#a7f3d0"
      },
      {
        label: "Kohlrabi Row",
        plants: "Kohlrabi (your non-Gurney's seeds)",
        count: "4–6 plants",
        spacing: "6–8\" apart",
        notes: "Transplant mid-April. Harvest at 2–3\" diameter (about 50 days). After first batch, direct sow a fall succession in late July in the same spot.",
        color: "#a7f3d0"
      },
      {
        label: "Cimarron Romaine Lettuce",
        plants: "Cimarron Romaine (#85103)",
        count: "4–6 plants",
        spacing: "12\" apart",
        notes: "Transplant early April or direct sow. Deep red romaine is GORGEOUS in the shade — the color intensifies. Partial shade prevents bolting which is lettuce's #1 enemy. 60–70 days. Succession sow for continuous salads. After it bolts in summer heat, replant for a fall crop in August.",
        color: "#bbf7d0"
      }
    ]
  },
  {
    id: "sunny-strip",
    title: "☀️ Sunny Strip (80\" × 12\")",
    dims: "6.5 ft × 1 ft · Full sun · Single row only",
    color: "#fef9c3",
    border: "#eab308",
    description: "Narrow but full sun. Perfect for compact herbs and quick crops.",
    sections: [
      {
        label: "Herb Row",
        plants: "2 Sweet Basil (#14602) + 3 Dill Delight (#70010)",
        count: "5 plants total",
        spacing: "Basil 18\" apart at ends, dill 8\" apart in between",
        notes: "This gives you a dedicated herb-cutting strip. Basil on both ends with dill filling the middle. Pinch basil at 6\" tall. Succession sow dill as it bolts.",
        color: "#bbf7d0"
      }
    ]
  },
  {
    id: "pots",
    title: "🪴 Pots (Full Sun)",
    dims: "20\" + 20\" + 16\" + 12\" diameter",
    color: "#f0f9ff",
    border: "#3b82f6",
    description: "Use POTTING MIX (not garden soil). Container plants need watering daily in July–August heat. Feed every 2 weeks with fish emulsion.",
    sections: [
      {
        label: "20\" Pot #1",
        plants: "1 Chocolate Cherry Tomato (#80652)",
        count: "1 plant",
        spacing: "—",
        notes: "Cherry tomatoes are the BEST pot tomato. Indeterminate so it'll need a cage or stake in the pot. 70 days — your earliest tomato harvest. Rich, complex flavor.",
        color: "#fde68a"
      },
      {
        label: "20\" Pot #2",
        plants: "1 Primo II Jalapeño (#77718)",
        count: "1 plant",
        spacing: "—",
        notes: "Peppers do great in 20\" pots. Thick-walled 3–4\" jalapeños. Will produce all summer. Alt: put a scotch bonnet here for hot pepper insurance.",
        color: "#fed7aa"
      },
      {
        label: "16\" Pot",
        plants: "1 Sweet Basil (#14602) + 1 Dill Delight (#70010)",
        count: "2 plants",
        spacing: "8\" apart",
        notes: "Herb duo. Basil on the sunnier side. The dill will go to seed faster — use the seeds for pickling your Americana cucumbers!",
        color: "#bbf7d0"
      },
      {
        label: "12\" Pot",
        plants: "1 Sweet Basil (#14602)",
        count: "1 plant",
        spacing: "—",
        notes: "12\" is minimum for a productive herb. One beautiful basil plant, kept bushy by regular pinching. Great by the kitchen door.",
        color: "#bbf7d0"
      }
    ]
  }
];

export default function MasterPlan() {
  const [tab, setTab] = useState("timeline");
  const [expanded, setExpanded] = useState(zones.map(z => z.id));
  const [tlFilter, setTlFilter] = useState("all");
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  // Sync body theme so background matches outside the component
  if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const { doNow, comingSoon, notYet } = categorizeTimeline();

  const toggle = (id) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredTimeline = tlFilter === "all" ? timeline :
    timeline.filter(t => t.tasks.some(tk => tk.type === tlFilter));

  return (
    <div data-theme={dark ? "dark" : "light"} style={{ fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 1100, margin: "0 auto", padding: 16, background: "var(--bg)", color: "var(--text)", minHeight: "100vh", transition: "background 0.2s, color 0.2s" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button onClick={() => setDark(!dark)} style={{ background: "var(--card-alt)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bold)", margin: 0 }}>🌱 2026 Master Garden Plan</h1>
        <p style={{ color: "var(--text-sub)", fontSize: 14, margin: "4px 0" }}>Zone 6b · Last frost: ~{FROST_DATE} · Today: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: 12, overflow: "hidden", border: "2px solid var(--tab-active)" }}>
        {[["timeline","📅 Sowing Timeline"],["layout","🗺️ Planting Layout"],["fence","🪵 Fence Diagram"],["inventory","📋 Seed Inventory"],["maps","📐 Plot Maps"],["cam","📷 Plant Cam"]].map(([val,label]) => (
          <button key={val} onClick={() => setTab(val)}
            style={{ flex: 1, padding: "12px 8px", border: "none", background: tab===val ? "var(--tab-active)" : "var(--tab-inactive)",
              color: tab===val ? "var(--tab-active-text)" : "var(--tab-inactive-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══ TIMELINE TAB ═══ */}
      {tab === "timeline" && (
        <div>
          {/* Action banners */}
          {doNow.length > 0 && (
            <div style={{ background: "var(--card)", borderLeft: "4px solid #dc2626", borderRadius: 8, padding: 14, marginBottom: 10, border: "1px solid var(--border)", borderLeftWidth: 4, borderLeftColor: "#dc2626" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#dc2626" }}>🚨 DO NOW:</div>
              {doNow.map((e, i) => (
                <div key={i} style={{ fontSize: 13, marginTop: i ? 4 : 2, color: "var(--text)" }}><strong>{e.date}:</strong> {plantNames(e)}</div>
              ))}
            </div>
          )}
          {comingSoon.length > 0 && (
            <div style={{ background: "var(--card)", borderLeft: "4px solid #2563eb", borderRadius: 8, padding: 14, marginBottom: 10, border: "1px solid var(--border)", borderLeftWidth: 4, borderLeftColor: "#2563eb" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#3b82f6" }}>📅 COMING UP:</div>
              {comingSoon.map((e, i) => (
                <div key={i} style={{ fontSize: 13, marginTop: i ? 4 : 2, color: "var(--text)" }}><strong>{e.date}:</strong> {plantNames(e)}</div>
              ))}
            </div>
          )}
          {notYet.length > 0 && (
            <div style={{ background: "var(--card)", borderLeft: "4px solid #d97706", borderRadius: 8, padding: 14, marginBottom: 16, border: "1px solid var(--border)", borderLeftWidth: 4, borderLeftColor: "#d97706" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#d97706" }}>⏳ DO NOT START YET:</div>
              {notYet.map((e, i) => (
                <div key={i} style={{ fontSize: 13, marginTop: i ? 4 : 2, color: "var(--text-sub)" }}><strong>{e.date}:</strong> {plantNames(e)}</div>
              ))}
            </div>
          )}

          {/* Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[["all","All dates"],["indoor","Indoor sowing only"],["outdoor","Outdoor only"],["harvest","Harvests only"]].map(([v,l]) => (
              <button key={v} onClick={() => setTlFilter(v)}
                style={{ padding: "5px 12px", borderRadius: 20, border: tlFilter===v ? "2px solid var(--tab-active)" : "1px solid var(--chip-border)",
                  background: tlFilter===v ? "var(--tab-active)" : "var(--tab-inactive)", color: tlFilter===v ? "var(--tab-active-text)" : "var(--tab-inactive-text)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                {l}
              </button>
            ))}
          </div>

          {/* Timeline cards */}
          {filteredTimeline.map((entry, ei) => (
            <div key={ei} style={{ marginBottom: 12, borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ background: entry.color, color: "white", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{entry.date}{isActiveNow(entry.range) ? " (DO NOW)" : ""}</span>
                <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: 8 }}>{entry.urgency}</span>
              </div>
              <div style={{ background: "var(--card)", padding: "10px 14px" }}>
                {entry.tasks.filter(tk => tlFilter === "all" || tk.type === tlFilter).map((task, ti) => (
                  <div key={ti} style={{ marginBottom: ti < entry.tasks.length - 1 ? 10 : 0, paddingBottom: ti < entry.tasks.length - 1 ? 10 : 0, borderBottom: ti < entry.tasks.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: task.type === "indoor" ? "#fdba74" : task.type === "outdoor" ? "#86efac" : task.type === "harvest" ? "#6ee7b7" : "#e5e7eb", color: task.type === "indoor" ? "#7c2d12" : task.type === "outdoor" ? "#14532d" : task.type === "harvest" ? "#064e3b" : "#374151" }}>
                        {task.type === "indoor" ? "INDOORS" : task.type === "harvest" ? "HARVEST" : "OUTDOORS"}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{task.plant}</span>
                      {task.sku && <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--card-alt)", padding: "1px 5px", borderRadius: 3 }}>{task.sku}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.5, paddingLeft: 2 }}>{task.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Gantt chart — 48 cols: 4 per month, Jan–Dec full year */}
          <div className="scroll-hint-text">← Swipe to scroll →</div>
          <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 14, marginTop: 20, overflowX: "auto" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--text-bold)" }}>📊 Full Year Timeline <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-sub)" }}>(153-day growing season)</span></h3>
            <div style={{ fontSize: 10, color: "var(--text-sub)", marginBottom: 6 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#fdba74", borderRadius: 2, marginRight: 3, verticalAlign: "middle" }}></span>Indoors
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#c4b5fd", borderRadius: 2, marginLeft: 10, marginRight: 3, verticalAlign: "middle" }}></span>Direct sow
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#67e8f9", borderRadius: 2, marginLeft: 10, marginRight: 3, verticalAlign: "middle" }}></span>Harden off
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#a3e635", borderRadius: 2, marginLeft: 10, marginRight: 3, verticalAlign: "middle" }}></span>Growing
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#f87171", borderRadius: 2, marginLeft: 10, marginRight: 3, verticalAlign: "middle" }}></span>Harvest
            </div>
            {/* 48 cols, 4 per month. Col = (month-1)*4 + week. Jan=0-3, Feb=4-7, Mar=8-11, Apr=12-15, May=16-19, Jun=20-23, Jul=24-27, Aug=28-31, Sep=32-35, Oct=36-39, Nov=40-43, Dec=44-47 */}
            <div style={{ display: "grid", gridTemplateColumns: "140px repeat(48,1fr)", gap: 0, marginBottom: 2, minWidth: 700 }}>
              <div></div>
              {["Jan","","","","Feb","","","","Mar","","","","Apr","","","","May","","","","Jun","","","","Jul","","","","Aug","","","","Sep","","","","Oct","","","","Nov","","","","Dec","","",""].map((m,i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text-sub)", textAlign: "center", fontWeight: m ? 700 : 400 }}>{m}</div>
              ))}
            </div>
            {(() => {
              const now = new Date();
              const start = new Date(2026, 0, 1);
              const end = new Date(2026, 11, 31);
              if (now < start || now > end) return null;
              const frac = (now - start) / (end - start);
              const exact = frac * 48;
              const col = Math.min(47, Math.floor(exact));
              const offset = (exact - col) * 100;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "140px repeat(48,1fr)", gap: 0, marginBottom: 2, minWidth: 700 }}>
                  <div></div>
                  {Array.from({length:48}).map((_,i) => (
                    <div key={i} style={{ height: 28, position: "relative" }}>
                      {i === col && <div style={{ position: "absolute", left: `${offset}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: 7, fontWeight: 700, color: "var(--today-color)", whiteSpace: "nowrap" }}>YOU ARE HERE</span>
                        <span style={{ fontSize: 18, color: "var(--today-color)", lineHeight: 1 }}>▼</span>
                      </div>}
                    </div>
                  ))}
                </div>
              );
            })()}
            {/* Data rows with frost lines overlaid */}
            {(() => {
              const rows = (() => {
                const r = [];
                for (const row of [
                  { n: "Scotch Bonnet", indoor: [7,17], harden: [18,18], grow: [19,33], harvest: [34,37] },
                  { n: "Primo II Jalap.", indoor: [7,17], harden: [18,18], grow: [19,30], harvest: [31,39] },
                  { n: "Cimarron Romaine ×2", rows: [{ indoor: [7,12], grow: [13,22], harvest: [23,25] }, { direct: [31,31], grow: [32,35], harvest: [36,39] }] },
                  { n: "Kale ×2", rows: [{ indoor: [8,13], grow: [14,21], harvest: [22,43] }, { direct: [27,27], grow: [28,33], harvest: [34,43] }] },
                  { n: "Kohlrabi ×2", rows: [{ indoor: [8,13], grow: [14,19], harvest: [20,23] }, { direct: [27,27], grow: [28,33], harvest: [34,39] }] },
                  { n: "Rainbow Blend", indoor: [10,17], harden: [18,18], grow: [19,31], harvest: [32,39] },
                  { n: "San Marzano", indoor: [10,17], harden: [18,18], grow: [19,33], harvest: [34,37] },
                  { n: "Choc Cherry", indoor: [10,17], harden: [18,18], grow: [19,30], harvest: [31,39] },
                  { n: "Sweet Basil", indoor: [12,17], harden: [18,18], grow: [19,26], harvest: [27,35] },
                  { n: "Buzz Button", indoor: [12,17], harden: [18,18], grow: [19,30], harvest: [31,39] },
                  { n: "Zinnia Pumila", indoor: [13,17], harden: [18,18], grow: [19,39] },
                  { n: "Americana Cuke", indoor: [14,17], harden: [18,18], grow: [19,26], harvest: [27,35] },
                  { n: "Blk Magic Zuke", indoor: [15,17], harden: [18,18], grow: [19,25], harvest: [26,35] },
                  { n: "Avalanche Pea", direct: [10,10], grow: [11,19], harvest: [20,24] },
                  { n: "Dill Delight ×3", rows: [{ direct: [14,14], grow: [15,19], harvest: [20,23] }, { direct: [20,20], grow: [21,23], harvest: [24,27] }, { direct: [24,24], grow: [25,27], harvest: [28,31] }] },
                  { n: "Purple Queen ×2", rows: [{ direct: [19,19], grow: [20,25], harvest: [26,31] }, { direct: [21,21], grow: [22,27], harvest: [28,33] }] },
                  { n: "KY Wonder Pole", direct: [19,19], grow: [20,29], harvest: [30,35] },
                ]) {
                  const subrows = row.rows || [row];
                  const subH = Math.max(6, Math.floor(16 / subrows.length));
                  const totalH = subH * subrows.length + (subrows.length - 1);
                  r.push({ ...row, subrows, subH, totalH });
                }
                return r;
              })();
              // frost lines at col 18 (right edge) and 38 (right edge)
              // percentage = (140 + col * colWidth) / totalWidth — but with 1fr cols, use calc
              const lastFrostPct = `calc(140px + (100% - 140px) * ${19 / 48})`;
              const firstFrostPct = `calc(140px + (100% - 140px) * ${39 / 48})`;
              return (
                <div style={{ position: "relative", minWidth: 700 }}>
                  <div style={{ position: "absolute", left: lastFrostPct, top: -8, bottom: -8, width: 2, background: "var(--last-frost)", opacity: 0.7, zIndex: 2, pointerEvents: "none" }}></div>
                  <div style={{ position: "absolute", left: firstFrostPct, top: -8, bottom: -8, width: 2, background: "var(--first-frost)", opacity: 0.7, zIndex: 2, pointerEvents: "none" }}></div>
                  {rows.map((row, ri) => (
                    <div key={ri} style={{ display: "grid", gridTemplateColumns: "140px repeat(48,1fr)", gap: 1, marginBottom: 2, alignItems: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", paddingRight: 4, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.n}</div>
                      {Array.from({length:48}).map((_,ci) => (
                        <div key={ci} style={{ height: row.totalH, display: "flex", flexDirection: "column", gap: 1 }}>
                          {row.subrows.map((sr, si) => {
                            let bg = "var(--gantt-empty)";
                            if (sr.indoor && ci >= sr.indoor[0] && ci <= sr.indoor[1]) bg = "#fdba74";
                            if (sr.harden && ci >= sr.harden[0] && ci <= sr.harden[1]) bg = "#67e8f9";
                            if (sr.grow && ci >= sr.grow[0] && ci <= sr.grow[1]) bg = "#a3e635";
                            if (sr.direct && ci >= sr.direct[0] && ci <= sr.direct[1]) bg = "#c4b5fd";
                            if (sr.harvest && ci >= sr.harvest[0] && ci <= sr.harvest[1]) bg = "#f87171";
                            return <div key={si} style={{ height: row.subH, background: bg, borderRadius: 1 }}></div>;
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ display: "grid", gridTemplateColumns: "140px repeat(48,1fr)", gap: 0, marginTop: 3, minWidth: 700 }}>
              <div></div>
              {Array.from({length:48}).map((_,i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  {i === 19 && <span style={{ fontSize: 11, color: "var(--last-frost)", fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.1 }}>❄️ Last Frost</span>}
                  {i === 39 && <span style={{ fontSize: 11, color: "var(--first-frost)", fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.1 }}>❄️ First Frost</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LAYOUT TAB ═══ */}
      {tab === "layout" && (
        <div>
          <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", color: "white", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>🎯 The Game Plan</div>
            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              <strong>Fence strip = vertical garden wall.</strong> Pole beans, cucumbers, and zucchini climb the west-facing fence. San Marzano + cherry tomato caged/tied in the center. Peas at the far end go in first (March).
              <br/><br/>
              <strong>Main plot sun zone = tomatoes + peppers + bush beans.</strong> Rainbow Blend heirlooms in back, peppers in front, Purple Queen beans along the sunny edge. Basil companion-planted throughout.
              <br/><br/>
              <strong>Main plot shade zone = cool-season crops.</strong> Snow peas along the sun/shade boundary, kale + kohlrabi + Cimarron romaine in the shade. These crops THRIVE here.
              <br/><br/>
              <strong>Pots = bonus harvest.</strong> Cherry tomato, jalapeño, and herbs.
            </div>
          </div>

          {zones.map(zone => (
            <div key={zone.id} style={{ marginBottom: 14, borderRadius: 12, border: `2px solid ${zone.border}`, overflow: "hidden" }}>
              <div onClick={() => toggle(zone.id)}
                style={{ background: dark ? zone.border + "22" : zone.color, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: dark ? zone.border : "inherit" }}>{zone.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 2 }}>{zone.dims}</div>
                </div>
                <span style={{ fontSize: 18, color: "var(--text-sub)" }}>{expanded.includes(zone.id) ? "▾" : "▸"}</span>
              </div>
              {expanded.includes(zone.id) && (
                <div style={{ padding: 14, background: "var(--card)" }}>
                  <p style={{ fontSize: 13, color: "var(--text)", marginTop: 0, marginBottom: 10, lineHeight: 1.5 }}>{zone.description}</p>
                  {zone.setupNote && (
                    <div style={{ background: "var(--tip-bg)", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12, color: "var(--tip-text)", lineHeight: 1.5 }}>
                      <strong>🔧 SETUP:</strong> {zone.setupNote}
                    </div>
                  )}
                  {zone.sections.map((sec, i) => (
                    <div key={i} style={{ borderLeft: `4px solid ${sec.color}`, paddingLeft: 12, marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-bold)", marginBottom: 3 }}>{sec.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text)" }}>
                        <div><strong>Plant:</strong> {sec.plants}</div>
                        <div><strong>Qty:</strong> {sec.count} · <strong>Spacing:</strong> {sec.spacing}</div>
                        <div style={{ color: "var(--text-sub)", fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{sec.notes}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ background: "var(--zinnia-bg)", border: "2px solid #ec4899", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>🌸 Zinnia Pumila — The Border Plant</div>
            <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
              Tuck zinnias into gaps and edges: front of main plot, ends of fence strip, around pots. 18–24\" tall, bloom in 60–70 days, attract pollinators. Direct sow after May 18 or start indoors early April. They go wherever there's leftover sunny space.
            </div>
          </div>

          <div style={{ background: "var(--success-bg)", borderRadius: 12, border: "1px solid var(--success-border)", padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "var(--success-text)" }}>♻️ Succession & Relay Planting</div>
            <div style={{ fontSize: 12, color: "var(--success-text)", lineHeight: 1.7 }}>
              <strong>March:</strong> Snow peas go in first (fence + shade zone).
              <br/><strong>May:</strong> Everything else fills in after last frost.
              <br/><strong>Late June:</strong> Peas die back → replant spots with fall beans or lettuce.
              <br/><strong>Late July:</strong> Direct sow fall kale + kohlrabi.
              <br/><strong>August:</strong> Sow more Cimarron romaine for fall salads.
              <br/><strong>Sept–Nov:</strong> Frost-sweetened kale. Tomatoes/peppers produce until hard frost (~Oct 15).
            </div>
          </div>
        </div>
      )}

      {/* ═══ FENCE TAB ═══ */}
      {tab === "fence" && (
        <div>
          <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "var(--text-bold)" }}>🪵 Fence Strip Layout (18 ft, top-down view)</h2>
            <p style={{ fontSize: 12, color: "var(--text-sub)", margin: "0 0 14px 0" }}>West-facing fence behind (top). Yard/sidewalk in front (bottom). Full afternoon sun.</p>
            
            {/* Fence label */}
            <div style={{ background: "#78716c", color: "white", textAlign: "center", fontSize: 11, fontWeight: 600, padding: 4, borderRadius: "8px 8px 0 0" }}>
              ← FENCE (west-facing) — twine trellis at 12", 24", 36", 48", 60" heights →
            </div>
            
            {/* Strip sections */}
            <div style={{ display: "flex", height: 80, overflow: "hidden", border: "2px solid #78716c", borderTop: "none" }}>
              {[
                { label: "KY Wonder\nPole Beans", w: "22%", bg: "#86efac", sub: "4 ft · Climbs 5–7'", note: "Sow May 18+\n4\" apart" },
                { label: "Americana\nCucumber", w: "22%", bg: "#bbf7d0", sub: "4 ft · Vining", note: "2 plants\n24\" apart" },
                { label: "San Marzano +\nChoc Cherry Tom", w: "28%", bg: "#fde68a", sub: "5 ft · Caged + tied", note: "2 plants\n30\" apart" },
                { label: "Black Magic\nZucchini", w: "22%", bg: "#d9f99d", sub: "4 ft · Tie to fence", note: "1 plant\nsling fruit" },
                { label: "Snow\nPeas", w: "6%", bg: "#c7d2fe", sub: "1'", note: "Mar\nsow" },
              ].map((s, i) => (
                <div key={i} style={{ width: s.w, background: s.bg, color: "#1c1917", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: i < 4 ? "2px dashed #a8a29e" : "none", padding: 3 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: "center", lineHeight: 1.2, whiteSpace: "pre-line" }}>{s.label}</div>
                  <div style={{ fontSize: 8, color: "#57534e", textAlign: "center" }}>{s.sub}</div>
                  <div style={{ fontSize: 8, color: "#57534e", textAlign: "center", marginTop: 2, whiteSpace: "pre-line" }}>{s.note}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--card-alt)", textAlign: "center", fontSize: 10, color: "var(--text-sub)", padding: 3, borderRadius: "0 0 8px 8px", border: "2px solid #78716c", borderTop: "none" }}>
              ← GROUND LEVEL (11\" wide strip between fence and sidewalk) →
            </div>

            <div style={{ marginTop: 16, fontSize: 12, color: "var(--text)", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>🔧 How to set up the fence trellis:</div>
              <div>1. Screw small eye screws or cup hooks into the fence every 24\" horizontally, at heights of 12", 24", 36", 48", and 60" from ground.</div>
              <div>2. Run jute twine or garden wire horizontally through the hooks at each height level.</div>
              <div>3. Optionally run vertical twine every 12\" for a grid pattern (helps cucumbers and beans find support).</div>
              <div>4. Cost: ~$5 in eye screws + $3 in jute twine.</div>
              <div style={{ marginTop: 8 }}><strong>Training tips:</strong></div>
              <div>• <strong>Pole beans:</strong> Wind the young vine around the nearest vertical twine. After that, they climb on their own.</div>
              <div>• <strong>Cucumbers:</strong> Use soft fabric ties (cut up old t-shirts) to loosely attach tendrils to horizontal twine. They'll grab on within a day.</div>
              <div>• <strong>Zucchini:</strong> NOT a natural climber. Tie the main stem to the fence every 6–8\" as it grows. When fruit gets heavy (8\"+), cradle it in a fabric sling tied to a higher twine line.</div>
              <div>• <strong>Cherry tomato:</strong> Tie main stem to fence. Prune to 1–2 leaders for a flatter, fan-shaped growth against the fence.</div>
              <div>• <strong>San Marzano:</strong> Use a cage pushed against the fence. It's determinate so it stays compact.</div>
            </div>
          </div>

          {/* Planting order on fence */}
          <div style={{ background: "var(--tip-bg)", borderRadius: 12, padding: 14, marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--tip-text)" }}>⏱️ Fence planting order:</div>
            <div style={{ fontSize: 12, color: "var(--tip-text)", lineHeight: 1.7 }}>
              <strong>1. Mid-March:</strong> Snow peas at the right end (frost-tolerant, go in first).
              <br/><strong>2. Late March–April:</strong> Till and amend the fence strip soil.
              <br/><strong>3. May 18–25:</strong> Everything else goes in: transplant tomatoes and set cages, then direct sow pole beans and cucumbers (or transplant if started indoors). Zucchini last.
              <br/><strong>4. Late June:</strong> Peas finish → optionally replant that spot with more beans.
            </div>
          </div>
        </div>
      )}

      {/* ═══ INVENTORY TAB ═══ */}
      {tab === "inventory" && (
        <div>
          <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "var(--text-bold)" }}>📋 Gurney's Seed Inventory</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "5px 6px", color: "var(--text-sub)" }}>SKU</th>
                    <th style={{ textAlign: "left", padding: "5px 6px", color: "var(--text-sub)" }}>Variety</th>
                    <th style={{ textAlign: "left", padding: "5px 6px", color: "var(--text-sub)" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "5px 6px", color: "var(--text-sub)" }}>Days</th>
                    <th style={{ textAlign: "left", padding: "5px 6px", color: "var(--text-sub)" }}>Seeds/Pkt</th>
                    <th style={{ textAlign: "left", padding: "5px 6px", color: "var(--text-sub)" }}>Where It Goes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["39845","Purple Queen Improved","Bush Bean","51","~150","Main plot front edge"],
                    ["76100","Avalanche Snow Pea","Snow Pea","~60","~225","Fence right end + shade zone"],
                    ["14199","Kentucky Wonder","Pole Bean","67","~150","Fence left end"],
                    ["85103","Cimarron Romaine","Lettuce","60–70","~200","Shade zone"],
                    ["15033","Black Magic Zucchini","Zucchini","~50","~25","Fence right-center"],
                    ["14602","Sweet Basil","Herb","85","~150","Everywhere (sun zone, strip, pots)"],
                    ["70077","Americana Hybrid","Cucumber","60","~20","Fence left-center"],
                    ["77718","Primo II Jalapeño","Hot Pepper","—","~20","Main plot 2nd row + pot"],
                    ["70010","Dill Delight","Herb","40","~200","Sunny strip + main plot"],
                    ["80652","Chocolate Cherry","Tomato","70","~25","Fence center + 20\" pot"],
                    ["85963","San Marzano","Tomato","85","~25","Fence center"],
                    ["73592","Rainbow Blend","Tomato","85–100","~30","Main plot back row"],
                    ["—","Buzz Button","Herb/Novelty","60–70","—","Sunny gaps + pots"],
                  ].map(([sku,name,type,days,seeds,location],i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "5px 6px", fontFamily: "monospace", color: "var(--text-sub)", fontSize: 10 }}>{sku}</td>
                      <td style={{ padding: "5px 6px", fontWeight: 600 }}>{name}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text-sub)" }}>{type}</td>
                      <td style={{ padding: "5px 6px" }}>{days}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text-sub)" }}>{seeds}</td>
                      <td style={{ padding: "5px 6px", color: "var(--text-dim)", fontSize: 10 }}>{location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 16, marginTop: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "var(--text-bold)" }}>📊 Total Plant Count (all zones)</h2>
            <div style={{ fontSize: 12, lineHeight: 2, color: "var(--text)" }}>
              {[
                ["Heirloom Rainbow Blend Tomato","2 plants → main plot back row"],
                ["San Marzano Tomato","1 plant → fence center"],
                ["Chocolate Cherry Tomato","2 plants (1 fence + 1 pot)"],
                ["Scotch Bonnet Pepper","1 plant → main plot"],
                ["Primo II Jalapeño","3 plants (2 ground + 1 pot)"],
                ["Sweet Basil","5–6 plants (ground + strip + pots)"],
                ["Dill Delight","5–6 plants (strip + main plot, succession sow)"],
                ["Kentucky Wonder Pole Bean","10–12 seeds → fence left end"],
                ["Americana Cucumber","2 plants → fence left-center"],
                ["Black Magic Zucchini","1 plant → fence right-center"],
                ["Avalanche Snow Pea","45–60 seeds (fence + shade zone)"],
                ["Purple Queen Bush Bean","12–15 seeds → main plot front"],
                ["Cimarron Romaine","4–6 plants → shade zone"],
                ["Kale","4–6 plants → shade zone"],
                ["Kohlrabi","4–6 plants → shade zone"],
                ["Zinnia Pumila","Borders/gaps wherever sunny space exists"],
                ["Buzz Button","3–4 plants → sunny gaps + pots"],
              ].map(([name,where],i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "2px 0" }}>
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  <span style={{ color: "var(--text-sub)", fontSize: 11, textAlign: "right" }}>{where}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--tip-bg)", borderRadius: 12, padding: 14, marginTop: 14, fontSize: 12, color: "var(--tip-text)", lineHeight: 1.6 }}>
            <strong>💡 Leftover seeds:</strong> You'll have WAY more seeds than you need for most packets (especially peas at ~225, basil at ~150, dill at ~200, bush beans at ~150). Save extras in a cool, dry, dark place (ziplock bag in the fridge) — most veggie seeds stay viable 2–4 years. You can also succession-sow throughout the season or share with neighbors.
          </div>
        </div>
      )}

      {/* ═══ PLOT MAPS TAB ═══ */}
      {tab === "maps" && (
        <div>
          <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 16, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "var(--text-bold)" }}>📐 Scale Plot Diagrams</h2>
            <p style={{ fontSize: 12, color: "var(--text-sub)", margin: "0 0 14px 0" }}>To-scale grid maps of all garden zones. Page 1: Large plot with tree shade arc. Page 2: Fence strip, sunny strip, and pots.</p>
            <Document file="/garden_plots.pdf">
              <Page pageNumber={1} width={Math.min(888, typeof window !== "undefined" ? window.innerWidth - 64 : 888)} />
              <div style={{ borderTop: "2px dashed var(--border)", margin: "16px 0" }} />
              <Page pageNumber={2} width={Math.min(888, typeof window !== "undefined" ? window.innerWidth - 64 : 888)} />
            </Document>
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <a href="/garden_plots.pdf" download style={{ display: "inline-block", padding: "10px 20px", background: "var(--download-bg)", color: "var(--download-text)", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              ⬇ Download PDF
            </a>
          </div>
        </div>
      )}

      {/* ═══ PLANT CAM TAB ═══ */}
      {tab === "cam" && <PlantCam />}
    </div>
  );
}
