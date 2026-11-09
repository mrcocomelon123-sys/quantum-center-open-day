export const CONFERENCE = {
  name: "Photonics Novelty Workshop",
  shortName: "Photonics Novelty Workshop 2026",
  dates: "September 15-17, 2026",
  venue: "Auditorium 1003, Mayer Building, Electrical & Computer Engineering",
  institution: "Technion - Israel Institute of Technology, Haifa, Israel",
  organizers: ["Prof. Gadi Eisenstein", "Prof. Guy Bartal"],
};

// All-day Google Calendar event spanning Sep 15-17, 2026 (end date exclusive).
export const GOOGLE_CALENDAR_URL = (() => {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: CONFERENCE.name,
    dates: "20260915/20260918",
    details:
      "Photonics Novelty Workshop, organized by Prof. Gadi Eisenstein and Prof. Guy Bartal. Three days of invited talks on photonics, quantum optics, ultrafast science and nanophotonics.",
    location: `${CONFERENCE.venue}, ${CONFERENCE.institution}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
})();

export type AgendaItem = {
  time: string;
  title: string;
  affiliation?: string;
  talk?: string;
  kind?: "session" | "break" | "talk" | "note";
};

export type AgendaDay = {
  id: string;
  label: string;
  date: string;
  items: AgendaItem[];
};

export const AGENDA: AgendaDay[] = [
  {
    id: "day-1",
    label: "Day 1",
    date: "Tuesday, September 15, 2026",
    items: [
      { time: "09:00 - 09:15", title: "Light Breakfast", kind: "break" },
      {
        time: "09:20 - 09:30",
        title: "Opening Remarks: Gadi Eisenstein, Guy Bartal",
        kind: "note",
      },
      { time: "", title: "Session 1 — Moti Segev", kind: "session" },
      {
        time: "09:35 - 10:00",
        title: "Immanuel Bloch",
        affiliation: "Max Planck",
        talk: "New avenues for quantum simulation with ultracold atoms",
      },
      {
        time: "10:05 - 10:20",
        title: "Yuval Shagam",
        affiliation: "Technion",
        talk: "Searching for parity violation in trapped chiral molecular ions",
      },
      {
        time: "10:25 - 10:50",
        title: "Demetri Christodoulides",
        affiliation: "University of Southern California",
        talk: "Lagrange Beams",
      },
      { time: "10:55 - 11:25", title: "Coffee Break", kind: "break" },
      { time: "", title: "Session 2 — Nimrod Moiseyev", kind: "session" },
      {
        time: "11:25 - 11:50",
        title: "Vlad Shalaev",
        affiliation: "Purdue",
        talk: "Metamaterials: from Negative-Index to Extreme Space-Time Photonics",
      },
      {
        time: "11:55 - 12:10",
        title: "Igor Khanonkin",
        affiliation: "Technion",
        talk: "Ultrastrong Terahertz Light-Matter Coupling in Two-Dimensional Quantum Materials",
      },
      {
        time: "12:15 - 12:40",
        title: "Zhigang Chen",
        affiliation: "Nankai Univ. & San Francisco State Univ.",
        talk: "The Hidden Harmony of Light: Exploring Structure, Symmetry and Topology",
      },
      { time: "12:45 - 13:30", title: "Lunch Break", kind: "break" },
      { time: "", title: "Session 3 — Oren Cohen", kind: "session" },
      {
        time: "13:30 - 13:55",
        title: "Misha Ivanov",
        affiliation: "Max Born Institute",
        talk: "Attosecond quantum optics",
      },
      {
        time: "14:00 - 14:15",
        title: "Ofer Neufeld",
        affiliation: "Technion",
        talk: "Intense light-matter interactions in condensed matter: Ultrafast electron-phonon coupling and correlations",
      },
      {
        time: "14:20 - 14:45",
        title: "Alexandra Boltasseva",
        affiliation: "Purdue",
        talk: "Routes to extremely fast photonics: from materials to inverse design",
      },
      { time: "14:50", title: "Day 1 Closing Remarks", kind: "note" },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    date: "Wednesday, September 16, 2026",
    items: [
      { time: "08:40 - 08:55", title: "Light Breakfast", kind: "break" },
      { time: "", title: "Session 1 — Avinoam Zadok", kind: "session" },
      {
        time: "09:00 - 09:25",
        title: "Giorgos Tsironis",
        affiliation: "Tashkent University of Technology, Uzbekistan",
        talk: "Glassy and Condensed Phases in Disordered Multimode Nonlinear Optical Fibers",
      },
      {
        time: "09:30 - 09:45",
        title: "Ron Tenne",
        affiliation: "Technion",
        talk: "Observing fast crystal symmetry fluctuations through photon correlations",
      },
      {
        time: "09:50 - 10:15",
        title: "Gerhard Klimeck",
        affiliation: "Purdue",
        talk: "From Atomistic, Non-Equilibrium Quantum Statistical Mechanics Theory to Today's Transistor Design and Global Impact – My 30-Year Journey",
      },
      { time: "10:20 - 10:40", title: "Coffee & Networking Break", kind: "break" },
      { time: "", title: "Session 2 — Yoav Sagi", kind: "session" },
      {
        time: "10:40 - 11:05",
        title: "Mercedeh Khajavikhan",
        affiliation: "University of Southern California",
        talk: "Optical Thermodynamics: From Light thermalization to Entropy-Driven Photonic Control",
      },
      {
        time: "11:10 - 11:25",
        title: "Ido Schwartz",
        affiliation: "Technion",
        talk: "Time-Dependent Photonic Control for Restoring Polarization Entanglement in Solid-State Photon Sources",
      },
      {
        time: "11:30 - 11:55",
        title: "Mikael Rechtsman",
        affiliation: "Penn State",
        talk: "Pseudomagnetic and Hyperuniform Photonic Crystals",
      },
      {
        time: "12:00 - 12:15",
        title: "Ohad Segal",
        affiliation: "Technion",
        talk: "About Time: Observation of Time-Reflection at Optical Frequencies",
      },
      {
        time: "12:20 - 12:35",
        title: "Hanan Herzig Sheinfux",
        affiliation: "Bar-Ilan University",
        talk: "Hyperbolic polaritons: control and confinement",
      },
      { time: "12:40", title: "End of second day", kind: "note" },
    ],
  },
  {
    id: "day-3",
    label: "Day 3",
    date: "Thursday, September 17, 2026",
    items: [
      { time: "09:45 - 10:00", title: "Light Refreshments", kind: "break" },
      { time: "", title: "Session 1 — David Gershoni", kind: "session" },
      {
        time: "10:00 - 10:25",
        title: "Hrvoje Buljan",
        affiliation: "University of Zagreb",
        talk: "Theory of classical electrodynamics that accounts for quantization of charge",
      },
      {
        time: "10:30 - 10:45",
        title: "Pavel Sidorenko",
        affiliation: "Technion",
        talk: "Mamyshev Oscillators: Shaping the Future of Ultrafast Fiber Lasers",
      },
      {
        time: "10:50 - 11:05",
        title: "Aviv Karnieli",
        affiliation: "Technion",
        talk: "Towards entangling free electrons using Coulomb and nanophotonic-mediated elastic interactions",
      },
      {
        time: "11:10 - 11:35",
        title: "Olga Smirnova",
        affiliation: "Max Born Institute",
        talk: "Chirality in time: from topology of temporal shapes to spin selectivity in chiral molecules",
      },
      { time: "11:40 - 12:00", title: "Coffee Break", kind: "break" },
      { time: "", title: "Session 2 — Ido Kaminer", kind: "session" },
      {
        time: "12:00 - 12:15",
        title: "Eran Lustig",
        affiliation: "Technion",
        talk: "Observation of quadrature-dependent unidirectional flow of light",
      },
      {
        time: "12:20 - 12:35",
        title: "Rivka Bekenstein",
        affiliation: "Hebrew University",
      },
      {
        time: "12:40 - 12:55",
        title: "Ofer Kfir",
        affiliation: "Tel Aviv University",
        talk: "Towards quantum free-electron number states via quantum non-demolition dispersive measurement",
      },
      {
        time: "13:00 - 13:25",
        title: "Marin Soljacic",
        affiliation: "MIT",
        talk: "Intersections of AI, Photonics, and Scientific Discovery",
      },
      { time: "13:30", title: "Concluding Remarks", kind: "note" },
    ],
  },
];

export const SPEAKERS: string[] = AGENDA.flatMap((d) =>
  d.items.filter((i) => !i.kind).map((i) => i.title),
);

