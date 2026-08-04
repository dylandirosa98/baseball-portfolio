export type InstagramSlide = {
  kicker: string;
  title: string[];
  body?: string;
  items?: Array<{ label: string; detail: string }>;
  note?: string;
  theme?: "dark" | "light" | "red";
  image?: "/images/marketing-design-1.png" | "/images/marketing-design-2.png" | "/images/marketing-design-3.png" | "/images/marketing-hero.png";
  layout?: "standard" | "center" | "split";
};

export type InstagramCarousel = {
  id: string;
  title: string;
  category: string;
  objective: string;
  caption: string;
  slides: InstagramSlide[];
};

export const instagramCarousels: InstagramCarousel[] = [
  {
    id: "coach-scan",
    title: "Make the first scan count",
    category: "Recruiting education",
    objective: "Teach athletes what a coach needs to understand quickly.",
    caption: "A recruiting profile should not make a coach work to understand you. Lead with the essentials, make your best film easy to find, and give them a clear next step. Save this before you send your next recruiting email.\n\n#BaseballRecruiting #CollegeBaseball #StudentAthlete #RecruitingTips #DiamondProfile",
    slides: [
      { kicker: "Recruiting clarity", title: ["Make the", "first scan", "count."], body: "Your profile has one job: make the next step easy.", theme: "dark", layout: "split", image: "/images/marketing-design-1.png" },
      { kicker: "Start with identity", title: ["Who are you", "as a player?"], body: "A coach should immediately understand your position, graduation year, team, location, and how to contact you.", theme: "light", items: [{ label: "Position", detail: "Your primary role on the field." }, { label: "Class year", detail: "Where you fit in the recruiting timeline." }, { label: "Team + level", detail: "The context around your competition." }, { label: "Contact", detail: "A direct, professional next step." }] },
      { kicker: "Show, then tell", title: ["Put the proof", "within reach."], body: "Film should be obvious, playable on a phone, and supported by current player information.", theme: "red", items: [{ label: "Best clip first", detail: "Lead with the clearest evidence of your game." }, { label: "Label the footage", detail: "Help the viewer know what and who they are watching." }, { label: "Keep it current", detail: "Replace old footage as your game develops." }] },
      { kicker: "Remove friction", title: ["Do not make", "them hunt."], body: "Separate film links, stat pages, PDFs, and contact cards create unnecessary decisions. One organized link creates momentum.", theme: "dark", items: [{ label: "One tap", detail: "Film, stats, academics, and story together." }, { label: "Mobile first", detail: "Built for where most links get opened." }] },
      { kicker: "Before you send", title: ["Run the", "10-second test."], body: "Open your profile on a phone. Can someone identify you, find your best video, understand your level, and contact you without an explanation?", theme: "light", note: "If not, simplify before you send." },
      { kicker: "Diamond Profile", title: ["One player.", "One clear", "next step."], body: "Build a recruiting website that makes your film, stats, academics, and story easy to understand.", theme: "dark", layout: "center", note: "diamondprofile.app" },
    ],
  },
  {
    id: "one-link",
    title: "Stop sending a scavenger hunt",
    category: "Product education",
    objective: "Show why one organized recruiting link beats scattered materials.",
    caption: "Your film should not be in one message, your stats in another, and your contact information buried in a PDF. Give coaches one organized place to evaluate and remember you.\n\nOne player. One link. Your whole game.\n\n#BaseballRecruiting #RecruitingWebsite #CollegeBaseball #AthleteBranding #DiamondProfile",
    slides: [
      { kicker: "One-link recruiting", title: ["Stop sending", "a scavenger", "hunt."], body: "One player should not require six tabs and three attachments.", theme: "red", layout: "center" },
      { kicker: "The scattered version", title: ["Too many links", "lose the story."], theme: "light", items: [{ label: "YouTube", detail: "Film without the player context." }, { label: "Stat site", detail: "Numbers without your story." }, { label: "PDF", detail: "Information that ages quickly." }, { label: "Social profile", detail: "Noise mixed with useful details." }] },
      { kicker: "The organized version", title: ["One link builds", "one complete", "picture."], body: "The athlete becomes easier to evaluate, share, revisit, and contact.", theme: "dark", layout: "split", image: "/images/marketing-hero.png" },
      { kicker: "Everything connected", title: ["Your recruiting", "home base."], theme: "red", items: [{ label: "Film", detail: "Highlights, game footage, and training." }, { label: "Player data", detail: "Position, measurables, team, and class." }, { label: "Academics", detail: "The student behind the athlete." }, { label: "Contact", detail: "A clear path to start a conversation." }] },
      { kicker: "Built to be shared", title: ["Send it once.", "Update it", "anytime."], body: "The link stays the same while your film, numbers, team, and story keep moving forward.", theme: "light", note: "A current link is more useful than a perfect PDF from last season." },
      { kicker: "Diamond Profile", title: ["Your whole game.", "One polished", "link."], body: "Create yours free at diamondprofile.app", theme: "dark", layout: "center" },
    ],
  },
  {
    id: "profile-audit",
    title: "The seven-point profile audit",
    category: "Saveable checklist",
    objective: "Give players a concrete checklist they can use immediately.",
    caption: "Before you send another coach your recruiting information, audit these seven areas. A strong profile is current, easy to scan, and gives the viewer enough context to take the next step.\n\nSave this checklist and review it once a month.\n\n#RecruitingChecklist #BaseballRecruiting #StudentAthlete #CollegeBaseball #DiamondProfile",
    slides: [
      { kicker: "Save this checklist", title: ["The 7-point", "recruiting", "profile audit."], body: "Seven checks before your next coach email.", theme: "dark", layout: "center" },
      { kicker: "Checks 01 + 02", title: ["Identity and", "player details."], theme: "light", items: [{ label: "01 · Identity", detail: "Correct name, position, class year, team, and location." }, { label: "02 · Measurables", detail: "Current height, weight, bats, throws, and relevant metrics." }] },
      { kicker: "Checks 03 + 04", title: ["Film and", "performance."], theme: "red", items: [{ label: "03 · Film", detail: "Best footage first, clearly labeled, and playable on mobile." }, { label: "04 · Stats", detail: "Current season, team level, role, and enough context to interpret them." }] },
      { kicker: "Checks 05 + 06", title: ["Academics and", "communication."], theme: "dark", items: [{ label: "05 · Academics", detail: "Graduation year, school, GPA when appropriate, and academic interests." }, { label: "06 · Contact", detail: "Professional athlete, parent, and coach contact details where relevant." }] },
      { kicker: "Check 07", title: ["The mobile", "experience."], body: "Open every page, video, and button on your phone. If the important information is hard to find, the profile is not finished.", theme: "light", note: "Recruiting links travel through phones. Design for the actual experience." },
      { kicker: "Final review", title: ["Current beats", "complicated."], body: "A simple profile that is accurate today is more valuable than an elaborate one you never update.", theme: "red", layout: "center", note: "Save this post. Audit monthly." },
    ],
  },
  {
    id: "film-evaluation",
    title: "Film coaches can evaluate",
    category: "Film education",
    objective: "Help athletes make their video easier to understand and watch.",
    caption: "Good recruiting film is not about the longest edit or the loudest effects. It is about making your game easy to evaluate. Use clear footage, lead with your strongest evidence, and tell the viewer what they are watching.\n\n#BaseballFilm #RecruitingVideo #CollegeBaseball #BaseballRecruiting #DiamondProfile",
    slides: [
      { kicker: "Recruiting film", title: ["Make your film", "easy to", "evaluate."], body: "Clarity earns attention. Confusion spends it.", theme: "dark", layout: "split", image: "/images/marketing-design-3.png" },
      { kicker: "The opening", title: ["Lead with your", "strongest proof."], body: "Do not save the clip that best represents your game for the end. Give the viewer a reason to keep watching.", theme: "red", note: "Best evidence first—not necessarily your favorite edit." },
      { kicker: "Make yourself visible", title: ["Show them who", "to watch."], theme: "light", items: [{ label: "Identify yourself", detail: "Use a simple marker before the action begins." }, { label: "Keep the field visible", detail: "The result matters, but so does the play developing." }, { label: "Use stable footage", detail: "Evaluation is harder when the camera is constantly moving." }] },
      { kicker: "Add context", title: ["A label can save", "a question."], theme: "dark", items: [{ label: "Game + date", detail: "Show when the footage was captured." }, { label: "Team + opponent", detail: "Give competition context." }, { label: "Role", detail: "Position, inning, count, or situation when useful." }] },
      { kicker: "Remove the friction", title: ["Avoid these", "film mistakes."], theme: "light", items: [{ label: "Slow introductions", detail: "Do not make the viewer wait for baseball." }, { label: "Unclear player", detail: "Never force someone to guess who you are." }, { label: "Broken permissions", detail: "Test the link outside your own account." }, { label: "Only one angle", detail: "Show enough context to evaluate the skill." }] },
      { kicker: "The standard", title: ["Clear footage.", "Clear player.", "Clear next step."], body: "Put the film beside your stats, academics, and contact information—not in a vacuum.", theme: "red", layout: "center" },
    ],
  },
  {
    id: "stats-context",
    title: "Stats need context",
    category: "Player education",
    objective: "Teach athletes how to present numbers credibly.",
    caption: "A number without context can create more questions than answers. Show the season, competition level, sample, position, and role around your stats so coaches can understand what the performance represents.\n\n#BaseballStats #BaseballRecruiting #CollegeBaseball #StudentAthlete #DiamondProfile",
    slides: [
      { kicker: "Presenting performance", title: ["Stats without", "context are", "incomplete."], body: "A number is stronger when the viewer knows what it represents.", theme: "light", layout: "center" },
      { kicker: "Start with the frame", title: ["Name the season", "and the level."], theme: "dark", items: [{ label: "Season", detail: "Spring, summer, fall, or a specific event." }, { label: "Team", detail: "Where the performance happened." }, { label: "Competition", detail: "The level and setting around the sample." }] },
      { kicker: "Match the position", title: ["Show the numbers", "that fit your", "role."], body: "Pitchers, hitters, catchers, and two-way players should not all lead with the same information.", theme: "red", items: [{ label: "Pitchers", detail: "Workload, command, results, and relevant pitch data." }, { label: "Hitters", detail: "Production, on-base ability, power, and sample context." }] },
      { kicker: "Tell the whole truth", title: ["Credibility is", "a recruiting", "advantage."], body: "Use accurate numbers, label small samples, and update results when the season changes.", theme: "dark", note: "Trust is more valuable than a flattering stat line." },
      { kicker: "Beyond the box score", title: ["Your profile is", "more than stats."], theme: "light", items: [{ label: "Film", detail: "Shows how the performance looks." }, { label: "Measurables", detail: "Adds physical context." }, { label: "Academics", detail: "Completes the student-athlete picture." }, { label: "Story", detail: "Explains development and direction." }] },
      { kicker: "Diamond Profile", title: ["Put every number", "in the right", "place."], body: "Film, stats, academics, and story—organized in one recruiting website.", theme: "red", layout: "center" },
    ],
  },
  {
    id: "coach-email",
    title: "Before you email a coach",
    category: "Outreach education",
    objective: "Give athletes a practical communication structure.",
    caption: "The goal of a first email is not to tell your entire life story. It is to introduce yourself clearly, show why the school is relevant, provide one useful evaluation link, and make the next step easy.\n\nPersonalize it. Proofread it. Keep the profile current.\n\n#CoachEmail #BaseballRecruiting #CollegeBaseball #RecruitingTips #DiamondProfile",
    slides: [
      { kicker: "Recruiting outreach", title: ["Before you", "email a coach."], body: "A clear message starts before you press send.", theme: "red", layout: "center" },
      { kicker: "Step 01", title: ["Research the", "program."], body: "Know the school, level, location, academic fit, roster context, and why you are reaching out to this staff specifically.", theme: "dark", note: "Personalization should be real—not a school name pasted into a template." },
      { kicker: "Step 02", title: ["Write a useful", "subject line."], theme: "light", items: [{ label: "Include", detail: "Name, graduation year, position, and a relevant identifier." }, { label: "Avoid", detail: "Vague subjects, excessive punctuation, and empty hype." }] },
      { kicker: "Step 03", title: ["Build the email", "in four parts."], theme: "dark", items: [{ label: "1 · Introduction", detail: "Who you are as a student-athlete." }, { label: "2 · Fit", detail: "Why the program is relevant to you." }, { label: "3 · Evidence", detail: "One organized link with film and details." }, { label: "4 · Next step", detail: "A respectful, specific close." }] },
      { kicker: "Step 04", title: ["Send one", "evaluation link."], body: "Your link should open cleanly, work without a login, and contain the information referenced in your message.", theme: "red", layout: "split", image: "/images/marketing-design-2.png" },
      { kicker: "Step 05", title: ["Follow up with", "patience and", "new value."], body: "When you have a meaningful update—new film, verified metrics, schedule changes, or academic news—share it clearly.", theme: "light", note: "Professional persistence is different from constant messaging." },
    ],
  },
  {
    id: "stay-current",
    title: "Keep the recruiting profile current",
    category: "Workflow education",
    objective: "Turn profile maintenance into a simple habit.",
    caption: "Your recruiting link should get stronger as your season develops. Set a small update routine so your film, schedule, stats, and contact information never fall a season behind.\n\nA current profile is a useful profile.\n\n#RecruitingProcess #BaseballRecruiting #StudentAthlete #CollegeBaseball #DiamondProfile",
    slides: [
      { kicker: "Recruiting maintenance", title: ["Your profile is", "not a one-time", "project."], body: "Your game changes. Your recruiting link should keep up.", theme: "dark", layout: "center" },
      { kicker: "Update immediately", title: ["Change the facts", "when they", "change."], theme: "red", items: [{ label: "Team or role", detail: "Keep the current baseball context accurate." }, { label: "Contact details", detail: "Never let an old email block a conversation." }, { label: "Schedule", detail: "Make upcoming opportunities easy to find." }] },
      { kicker: "Update after evidence", title: ["Add proof as", "you earn it."], theme: "light", items: [{ label: "New film", detail: "Replace weaker or outdated footage." }, { label: "Verified metrics", detail: "Add accurate development markers." }, { label: "Season stats", detail: "Label the sample and update consistently." }, { label: "Academic progress", detail: "Keep the student side current too." }] },
      { kicker: "A simple rhythm", title: ["Use the", "10-minute review."], body: "Once a week: open the profile on your phone, test the film, scan every fact, and write down the next update.", theme: "dark", note: "Small maintenance prevents a full rebuild later." },
      { kicker: "What outdated signals", title: ["Old information", "creates doubt."], body: "If the team, class year, schedule, or film is stale, the viewer has to decide what else might be inaccurate.", theme: "red", note: "Accuracy is part of presentation." },
      { kicker: "Diamond Profile", title: ["Keep the link.", "Update the", "player."], body: "Change your film, stats, story, and design without changing the URL you already shared.", theme: "light", layout: "center" },
    ],
  },
  {
    id: "parent-playbook",
    title: "The parent recruiting playbook",
    category: "Parent education",
    objective: "Clarify healthy roles for athletes, parents, and coaches.",
    caption: "Recruiting works better when everyone knows their role. The athlete should own the voice. Parents can build the system. Coaches can add credible context. Together, the process becomes more organized and less stressful.\n\n#BaseballParents #RecruitingParents #StudentAthlete #BaseballRecruiting #DiamondProfile",
    slides: [
      { kicker: "For baseball families", title: ["The parent", "recruiting", "playbook."], body: "Support the process without replacing the athlete’s voice.", theme: "light", layout: "center" },
      { kicker: "The athlete owns", title: ["Voice and", "responsibility."], theme: "dark", items: [{ label: "Communication", detail: "Write, proofread, and send the coach messages." }, { label: "Preparation", detail: "Know the school and why it fits." }, { label: "Follow-through", detail: "Respond professionally and on time." }] },
      { kicker: "The parent supports", title: ["Systems and", "perspective."], theme: "red", items: [{ label: "Organization", detail: "Track dates, contacts, travel, and documents." }, { label: "Quality control", detail: "Catch broken links and outdated facts." }, { label: "Perspective", detail: "Help decisions stay grounded in fit." }] },
      { kicker: "The coach contributes", title: ["Context and", "credibility."], theme: "dark", items: [{ label: "Evaluation", detail: "A clear view of the athlete’s current game." }, { label: "Development", detail: "What has improved and what comes next." }, { label: "Contact", detail: "A trusted baseball reference when appropriate." }] },
      { kicker: "Build one system", title: ["Keep the process", "in one place."], body: "Maintain one current profile, one outreach tracker, one schedule, and one source of accurate information.", theme: "light", note: "Less searching. Fewer missed details. Better conversations." },
      { kicker: "The goal", title: ["Support the player.", "Strengthen the", "process."], body: "The best system makes it easier for the athlete to lead with confidence.", theme: "red", layout: "center" },
    ],
  },
  {
    id: "tournament-weekend",
    title: "The tournament weekend system",
    category: "Timely playbook",
    objective: "Give players a repeatable pre- and post-event routine.",
    caption: "A tournament weekend can create useful recruiting moments—but only if your information is ready before the first pitch and your follow-up is organized afterward. Use this simple Thursday-to-Sunday system.\n\n#TravelBaseball #TournamentBaseball #BaseballRecruiting #StudentAthlete #DiamondProfile",
    slides: [
      { kicker: "Tournament playbook", title: ["Before the first", "pitch, prepare", "the link."], body: "A simple Thursday-to-Sunday recruiting system.", theme: "red", layout: "center" },
      { kicker: "Thursday", title: ["Check the", "essentials."], theme: "dark", items: [{ label: "Schedule", detail: "Times, fields, opponent, and team." }, { label: "Profile", detail: "Current film, position, class year, and contacts." }, { label: "Links", detail: "Test everything from a signed-out phone." }] },
      { kicker: "Friday", title: ["Send useful", "event details."], body: "Keep outreach short: who you are, why the program fits, where you play, and one link for everything else.", theme: "light", note: "Make attendance easy. Do not bury the schedule." },
      { kicker: "Game day", title: ["Compete first.", "Document", "second."], body: "Your priority is the game. Have someone else capture stable, useful footage and label it while the context is fresh.", theme: "dark" },
      { kicker: "After the event", title: ["Turn footage", "into a useful", "update."], theme: "red", items: [{ label: "Review", detail: "Choose clips that clearly show the skill." }, { label: "Label", detail: "Add game, date, team, and relevant context." }, { label: "Publish", detail: "Update the same profile link." }, { label: "Follow up", detail: "Share real new value, not another generic message." }] },
      { kicker: "Repeatable beats rushed", title: ["Prepare once.", "Play freely.", "Follow up clearly."], body: "Save this system before your next tournament weekend.", theme: "light", layout: "center" },
    ],
  },
  {
    id: "build-before-attention",
    title: "Build before attention arrives",
    category: "Brand and product",
    objective: "Position a profile as preparation rather than hype.",
    caption: "A personal brand is not pretending to be famous. For a student-athlete, it means the information people find is accurate, organized, and representative of the work. Build the foundation before the opportunity arrives.\n\n#AthleteBranding #BaseballRecruiting #StudentAthlete #CollegeBaseball #DiamondProfile",
    slides: [
      { kicker: "Athlete preparation", title: ["Build before", "attention", "arrives."], body: "Opportunities rarely wait for you to organize your information.", theme: "dark", layout: "split", image: "/images/marketing-design-3.png" },
      { kicker: "Personal brand, defined", title: ["It is not hype.", "It is clarity."], body: "Your digital presence should accurately show who you are, how you play, what you value, and how to reach you.", theme: "light" },
      { kicker: "The digital handshake", title: ["Your link speaks", "before the", "conversation."], theme: "red", items: [{ label: "Presentation", detail: "Is the experience organized and intentional?" }, { label: "Accuracy", detail: "Are the facts current and credible?" }, { label: "Evidence", detail: "Can someone quickly see the game?" }, { label: "Character", detail: "Does the story feel like the actual athlete?" }] },
      { kicker: "Consistency wins", title: ["One identity", "across every", "touchpoint."], body: "Your email, profile, video labels, social bio, and contact information should tell the same clear story.", theme: "dark" },
      { kicker: "Be ready to share", title: ["The best time", "to organize is", "before the ask."], body: "When a coach, trainer, scout, or connection asks for your information, the answer should already exist.", theme: "light", note: "One current link. No rushed attachment hunt." },
      { kicker: "Diamond Profile", title: ["More than", "a stat line.", "Your whole game."], body: "Build your baseball recruiting website free at diamondprofile.app", theme: "red", layout: "center" },
    ],
  },
];
