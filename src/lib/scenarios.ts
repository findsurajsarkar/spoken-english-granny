export interface Scenario {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** Who the AI plays and what the conversation is about. */
  role: string;
  /** Granny's first line, so the conversation starts instantly. */
  opener: string;
  plus: boolean;
}

export const TALK_TURNS = 6;

export const SCENARIOS: Scenario[] = [
  {
    id: 'granny',
    emoji: '👵',
    title: 'Chat with Granny',
    desc: 'A relaxed chat about your day and your life.',
    role: 'Granny herself: a loving grandmother having a cosy chat with her grandchild about their day, family, food, hobbies and dreams.',
    opener: 'Aao beta, come sit with me! Tell me, how was your day today?',
    plus: false,
  },
  {
    id: 'restaurant',
    emoji: '🍽️',
    title: 'Ordering food',
    desc: 'Order a meal at a restaurant and ask about the menu.',
    role: 'a friendly waiter at a family restaurant in India. Help the learner order a meal: greet, suggest dishes, ask about spice level, drinks, and the bill.',
    opener: 'Good evening, welcome! Here is the menu. What would you like to have today?',
    plus: false,
  },
  {
    id: 'shopping',
    emoji: '🛍️',
    title: 'Shopping',
    desc: 'Buy clothes, ask for sizes and bargain a little.',
    role: 'a shopkeeper in a clothes shop. The learner is buying something: ask what they need, sizes, colours, price and a small discount.',
    opener: 'Hello, welcome to our shop! What are you looking for today?',
    plus: false,
  },
  {
    id: 'interview',
    emoji: '💼',
    title: 'Job interview',
    desc: 'A real HR round: about you, strengths, why this job.',
    role: 'a kind but professional HR interviewer at an Indian company. Ask one common HR interview question at a time (tell me about yourself, strengths and weaknesses, why this job, a challenge you faced, where you see yourself in 5 years), with a short follow-up based on their answer.',
    opener: "Good morning, and thank you for coming in. Let's begin: please tell me a little about yourself.",
    plus: true,
  },
  {
    id: 'office',
    emoji: '☕',
    title: 'Office small talk',
    desc: 'Chat with a colleague and talk about work.',
    role: 'a friendly new colleague chatting near the office coffee machine: weekend plans, current project, team, deadlines, lunch plans.',
    opener: "Hi! I don't think we've met properly yet. I just joined the team. How long have you been working here?",
    plus: true,
  },
  {
    id: 'doctor',
    emoji: '🩺',
    title: 'At the doctor',
    desc: 'Describe how you feel and understand advice.',
    role: 'a caring doctor at a clinic. Ask the learner about their symptoms, since when, and give simple advice. Keep it light, nothing scary.',
    opener: 'Hello, please have a seat. So, what seems to be the problem today?',
    plus: true,
  },
  {
    id: 'airport',
    emoji: '✈️',
    title: 'At the airport',
    desc: 'Check in, ask about your flight and baggage.',
    role: 'an airline check-in staff member at the airport: ticket, ID, bags, window or aisle seat, gate number and boarding time.',
    opener: 'Good morning! May I see your ticket and ID, please? Where are you flying to today?',
    plus: true,
  },
  {
    id: 'customer-care',
    emoji: '📞',
    title: 'Customer care call',
    desc: 'Complain politely about a product and get help.',
    role: 'a polite customer care executive on a phone call. The learner has a problem with something they bought online; ask for details and help solve it.',
    opener: 'Thank you for calling. My name is Priya. How may I help you today?',
    plus: true,
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);
