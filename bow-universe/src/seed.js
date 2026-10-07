const firstNames = ["Avery","Maya","Theo","Nia","Sam","Lina","Eli","Zoe","Arjun","June","Noah","Amara","Leo","Iris","Mateo","Priya","Miles","Sofia","Kai","Leila","Owen","Mina","Jonah","Anika","Ben","Cleo","Ravi","Tessa","Finn","Aya","Max","Nora","Dev","Lucy","Hugo","Sana","Jules","Mei","Ezra","Imani","Alex","Rina"];
const lastNames = ["Chen","Patel","Brooks","Kim","Alvarez","Okafor","Singh","Morgan","Sato","Diaz","Haddad","Lin","Carter","Shah","Reed","Park","Bennett","Kapoor","Nguyen","Wilson","Ibrahim"];
const schools = ["Babson", "Olin", "Wellesley"];
const colors = { Babson: "#74d6bb", Olin: "#f4a6c1", Wellesley: "#b7a7ff" };
const majors = ["Entrepreneurship & Design","Computer Science","Economics","Robotics Engineering","Data Science","Sustainability","Mechanical Engineering","Media Arts & Sciences","Computing & Design","Political Economy"];
const orgs = ["BOW Student Council","Rocketry Collective","Women in Business","Foundry Lab","BOW Ventures","Design for America","Robotics Club","Climate Studio","Community Health Lab","The Founders Circle"];
const roles = ["Campus Lead","Founder","Community Director","President","Product Lead","Research Lead","BOW Representative","Design Director","Operations Lead","Venture Fellow"];
const projects = ["Orbit","Pequod AI","Loop Local","Aster Robotics","Common Ground","Luma Health","Trace Climate","BOW Build Week","Sonder","Open Bench"];
const skills = ["prototyping","machine learning","fundraising","robotics","community building","product design","research","marketing","data visualization","full-stack development","storytelling","operations"];
const interests = ["climate tech","education","responsible AI","public art","venture capital","accessibility","social impact","hardware","food systems","creative technology"];

const people = firstNames.map((first, i) => {
  const school = schools[i % 3];
  const leadership = i % 2 === 0 ? [{ title: roles[i % roles.length], organization: orgs[(i * 3) % orgs.length], description: "Building an ambitious, welcoming community across the three colleges." }] : [];
  if (i % 7 === 0) leadership.push({ title: "Co-founder", organization: projects[(i + 1) % projects.length], description: "Leading early product direction and community partnerships." });
  const building = [{ name: projects[(i * 2) % projects.length], type: i % 3 === 0 ? "Startup" : i % 3 === 1 ? "Initiative" : "Research", stage: ["Exploring","Prototype","Pilot"][i % 3], description: ["A shared toolkit for student builders.","Making cross-campus collaboration easier.","Turning field research into something useful."][i % 3], needs: skills[(i + 4) % skills.length] }];
  return {
    id: `p${i + 1}`, name: `${first} ${lastNames[(i * 5) % lastNames.length]}`, school, year: String(2027 + (i % 4)),
    major: majors[(i * 7) % majors.length], role: leadership[0]?.title || ["Builder","Researcher","Designer","Organizer"][i % 4],
    bio: [`I make ideas tangible and bring thoughtful people into the room.`, `Curious about systems, communities, and the work between disciplines.`, `Building at the intersection of technology and human connection.`][i % 3],
    image: `https://i.pravatar.cc/160?img=${(i % 68) + 1}`, color: colors[school],
    leadership, projects: building, organizations: [orgs[(i * 3) % orgs.length], orgs[(i * 3 + 4) % orgs.length]],
    skills: [skills[i % skills.length], skills[(i + 3) % skills.length], skills[(i + 7) % skills.length]],
    interests: [interests[i % interests.length], interests[(i + 4) % interests.length]],
    lookingFor: ["A technical collaborator", "Design critique", "Pilot partners", "People asking the same questions"][i % 4],
    links: { linkedin: "https://www.linkedin.com", github: i % 3 === 0 ? "https://github.com" : "", website: i % 4 === 0 ? "https://example.com" : "" }
  };
});

const edgeMap = new Map();
function connect(a, b, type, context) {
  if (a === b) return;
  const key = [a, b].sort().join("-");
  if (!edgeMap.has(key)) edgeMap.set(key, { id: `e${edgeMap.size + 1}`, source: a, target: b, relationshipType: type, context, status: "confirmed" });
}
people.forEach((person, i) => {
  connect(person.id, people[(i + 1) % people.length].id, "Project collaborators", person.projects[0].name);
  connect(person.id, people[(i + 6) % people.length].id, "Same organization", person.organizations[0]);
  if (i % 2 === 0) connect(person.id, people[(i + 13) % people.length].id, "Cross-campus collaborators", "BOW initiative");
  if (i % 5 === 0) connect(person.id, people[(i + 19) % people.length].id, "Leadership team", "BOW Student Council");
});

module.exports = { people, connections: [...edgeMap.values()] };
