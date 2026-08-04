export type FacebookAdCreative = {
  id: string;
  name: string;
  audience: string;
  angle: string;
  eyebrow: string;
  headline: string[];
  supportingText: string;
  image: "/images/marketing-design-1.png" | "/images/marketing-design-2.png" | "/images/marketing-design-3.png" | "/images/marketing-hero.png";
  primaryText: string;
  linkHeadline: string;
  description: string;
  cta: "Learn More" | "Sign Up";
  variant: "phone" | "split" | "statement";
};

export const facebookAdCreatives: FacebookAdCreative[] = [
  {
    id: "parent-seven-places",
    name: "Seven places → one link",
    audience: "Parents of high-school baseball players",
    angle: "Organization",
    eyebrow: "MAKE RECRUITING EASIER TO MANAGE",
    headline: ["Their recruiting info", "shouldn't live in", "seven places."],
    supportingText: "Film, stats, academics, contact information, and their story—organized in one polished link.",
    image: "/images/marketing-hero.png",
    primaryText: "Film in one app. Stats in a spreadsheet. Academic details in an email. When someone asks about your player, pulling everything together should not become another project. Diamond Profile gives baseball families one polished, current link for the full player story.",
    linkHeadline: "Give their work one place to live",
    description: "Build a baseball recruiting website in minutes.",
    cta: "Learn More",
    variant: "phone",
  },
  {
    id: "parent-coach-asks",
    name: "When a coach asks",
    audience: "Parents actively navigating recruiting",
    angle: "Readiness",
    eyebrow: "BE READY FOR THE NEXT CONVERSATION",
    headline: ["When a coach asks", "for film—what do", "you send?"],
    supportingText: "One link can give them the film and the context around the player.",
    image: "/images/marketing-design-1.png",
    primaryText: "A video link alone does not tell the whole story. Give coaches one clear place to view film, stats, academics, schedule, contact information, and the athlete behind it all.",
    linkHeadline: "One link. The complete player.",
    description: "Start a Diamond Profile free.",
    cta: "Sign Up",
    variant: "split",
  },
  {
    id: "parent-first-impression",
    name: "A stronger first impression",
    audience: "Parents of serious student-athletes",
    angle: "Presentation",
    eyebrow: "THE WORK DESERVES A BETTER PRESENTATION",
    headline: ["They've put in", "the work."],
    supportingText: "Help them present it with the same level of care.",
    image: "/images/marketing-design-3.png",
    primaryText: "Years of practices, games, academics, and development should not be reduced to a scattered group of links. Diamond Profile turns the work your athlete has already done into one clear, professional recruiting website.",
    linkHeadline: "Present the whole player",
    description: "Film, stats, academics, story, and more.",
    cta: "Learn More",
    variant: "statement",
  },
  {
    id: "parent-less-chaos",
    name: "Less recruiting chaos",
    audience: "Busy baseball parents",
    angle: "Simplicity",
    eyebrow: "A SIMPLER SYSTEM FOR BASEBALL FAMILIES",
    headline: ["Less searching.", "Less resending.", "One current link."],
    supportingText: "Update the profile once. Keep sharing the same address.",
    image: "/images/marketing-design-2.png",
    primaryText: "Recruiting already comes with enough moving parts. Keep your athlete's important information organized in one place, update it as the season changes, and share the same link every time.",
    linkHeadline: "Make the process easier to manage",
    description: "Create their profile today.",
    cta: "Sign Up",
    variant: "split",
  },
  {
    id: "parent-phone-test",
    name: "The phone test",
    audience: "Parents reviewing recruiting materials",
    angle: "Mobile clarity",
    eyebrow: "TRY THIS 30-SECOND PROFILE TEST",
    headline: ["Can someone find", "the essentials", "from their phone?"],
    supportingText: "Film. Position. Graduation year. Academics. Contact. No digging required.",
    image: "/images/marketing-hero.png",
    primaryText: "Open your athlete's recruiting information from a phone and time how long it takes to find the essentials. Diamond Profile is designed to make the important details easy to scan, watch, and share from one link.",
    linkHeadline: "Make every visit easy to navigate",
    description: "See what a complete profile can look like.",
    cta: "Learn More",
    variant: "phone",
  },
  {
    id: "program-every-player",
    name: "Every player, presented well",
    audience: "Travel coaches and program directors",
    angle: "Team-wide consistency",
    eyebrow: "FOR CLUBS, ACADEMIES, AND PROGRAMS",
    headline: ["Give every player", "a recruiting presence", "you can stand behind."],
    supportingText: "Consistent profiles. Easier management. A better experience for families.",
    image: "/images/marketing-design-3.png",
    primaryText: "Your program develops the players. Diamond Profile helps you present them. Create and manage polished player websites with consistent structure, optional white-label branding, and one clear experience for every family.",
    linkHeadline: "A better profile system for your program",
    description: "Explore partner and white-label options.",
    cta: "Learn More",
    variant: "statement",
  },
];
