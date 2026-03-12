// ─────────────────────────────────────────────
//  utils/aiInsight.js
//  Calls Groq API to generate a short, personalized
//  developer personality insight using LLaMA 3.
//  Falls back gracefully if no API key is set.
//
//  Groq is OpenAI-compatible, so we use the same
//  fetch-based call with Groq's base URL.
// ─────────────────────────────────────────────

export async function generateInsight(userData) {
  // If no Groq key, return a smart rule-based insight instead
  if (!process.env.GROQ_API_KEY) {
    return generateRuleBasedInsight(userData);
  }

  try {
    const { username, repos, stars, topLanguages, score } = userData;
    const langList = Object.keys(topLanguages).slice(0, 3).join(", ");

    const prompt = `You are analyzing a GitHub developer profile. Write a single insightful paragraph (2-3 sentences) describing this developer's style, strengths, and focus areas.

Developer stats:
- Username: ${username}
- Public repos: ${repos}
- Total stars: ${stars}
- Top languages: ${langList}
- Productivity score: ${score}/100

Be specific, professional, and encouraging. Avoid generic statements. Reply with the paragraph only, no extra text.`;

    // Groq uses an OpenAI-compatible REST API
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",   // fast + high quality
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", err);
      return generateRuleBasedInsight(userData);
    }

    const json = await res.json();
    return json.choices[0]?.message?.content?.trim() || generateRuleBasedInsight(userData);

  } catch (err) {
    console.error("Groq fetch error:", err.message);
    return generateRuleBasedInsight(userData);
  }
}

// ─── Rule-based fallback ──────────────────────
//  No API key required. Generates a decent insight
//  using the developer's actual stats.
function generateRuleBasedInsight({ username, repos, stars, topLanguages, score }) {
  const langs = Object.keys(topLanguages);
  const primary = langs[0] || "various languages";
  const secondary = langs[1] || null;

  // Determine developer type from primary language
  const backendLangs = ["Python", "Go", "Rust", "Java", "C++", "C", "Ruby", "PHP", "C#"];
  const frontendLangs = ["JavaScript", "TypeScript", "CSS", "HTML", "Vue", "Svelte"];
  const dataLangs = ["Python", "R", "Julia", "Scala"];

  let archetype = "full-stack";
  if (backendLangs.includes(primary) && !frontendLangs.includes(primary)) archetype = "backend";
  if (frontendLangs.includes(primary)) archetype = "frontend";
  if (dataLangs.includes(primary) && primary === "Python" && langs.includes("Jupyter Notebook")) archetype = "data science";

  // Determine experience level from repo count and stars
  let experience = "growing";
  if (repos > 30 && stars > 50) experience = "experienced";
  if (repos > 15 && stars > 20) experience = "solid";
  if (repos < 5) experience = "early-stage";

  const langPhrase = secondary
    ? `${primary} and ${secondary}`
    : primary;

  const insights = [
    `${experience === "experienced" ? "A seasoned" : "An active"} ${archetype} developer with a strong focus on ${langPhrase}. ` +
    `With ${repos} public repositories and ${stars} total stars, ${username} demonstrates ${score > 60 ? "consistent" : "steady"} ` +
    `contribution patterns and a commitment to open-source development.`,
  ];

  if (score > 70) {
    insights.push(` Their high productivity score suggests an engineer who ships frequently and maintains multiple active projects.`);
  } else if (langs.length > 4) {
    insights.push(` The diverse language portfolio hints at a polyglot developer comfortable across different technology stacks.`);
  } else {
    insights.push(` Depth over breadth — focused expertise in a core set of technologies suggests a specialist mindset.`);
  }

  return insights.join("");
}