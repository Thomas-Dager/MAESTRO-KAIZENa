/**
 * Generates focused, specific YouTube search queries from a milestone title.
 * Instead of searching the raw title (which may contain day numbers and compound topics),
 * it extracts individual skills and adds the notebook topic as context.
 */

/**
 * Splits a milestone title into individual skill queries and formats them
 * with the notebook topic for precise YouTube searches.
 *
 * Examples:
 *   title: "Agarre de agujas eficiente y puntada estándar"
 *   topic: "Tejer"
 *   result: [
 *     { label: "Agarre de agujas", query: "agarre de agujas para tejer tutorial" },
 *     { label: "Puntada estándar", query: "puntada estándar tejer paso a paso" }
 *   ]
 */
export interface YouTubeQuery {
  label: string;
  query: string;
}

export function generateYouTubeQueries(
  milestoneTitle: string,
  notebookTopic: string
): YouTubeQuery[] {
  // 1. Clean day prefix patterns: "DÍA 3:", "Día 3 -", "3.", etc.
  let cleaned = milestoneTitle
    .replace(/^d[ií]a\s*\d+\s*[:.-]?\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim();

  // 2. Clean capstone/final markers
  cleaned = cleaned
    .replace(/★\s*/g, '')
    .replace(/proyecto\s+final[:\s]*/i, '')
    .replace(/desafío\s+final[:\s]*/i, '')
    .trim();

  // 3. Split on connectors: " y ", " & ", ": ", " con ", " + "
  // We want a max of 2 queries for UX clarity
  const splitPatterns = [
    /\s+y\s+(?=[a-záéíóúüñA-ZÁÉÍÓÚÜÑ])/,
    /\s+&\s+/,
    /\s+\+\s+/,
    /:\s+(?=[A-ZÁÉÍÓÚÜÑ])/,  // colon followed by capital (subtitle)
    /\s+con\s+(?=[a-záéíóúüñ])/,
  ];

  let parts: string[] = [cleaned];
  for (const pattern of splitPatterns) {
    if (parts.length >= 2) break;
    const newParts: string[] = [];
    for (const part of parts) {
      const split = part.split(pattern);
      newParts.push(...split);
    }
    if (newParts.length > parts.length) {
      parts = newParts;
    }
  }

  // Take max 2 parts, trim each
  parts = parts.slice(0, 2).map(p => p.trim()).filter(p => p.length > 2);

  // If no split happened, use the full cleaned title as one query
  if (parts.length === 0) parts = [cleaned];

  // 4. Clean the topic: remove parenthetical parts, keep core word
  const topicCore = notebookTopic
    .replace(/\([^)]+\)/g, '')  // remove parentheses
    .split(/[,;/]/)[0]           // take first part if compound
    .trim()
    .toLowerCase();

  // 5. Build query for each part
  const suffixes = ['tutorial paso a paso', 'para principiantes'];

  return parts.map((part, i) => {
    // Lowercase part for natural language query
    const partLower = part.toLowerCase();
    
    // Avoid duplicating the topic if it's already in the part
    const topicInPart = topicCore.split(' ').some(word =>
      word.length > 3 && partLower.includes(word)
    );

    const query = topicInPart
      ? `${partLower} ${suffixes[i] || 'tutorial'}`
      : `${partLower} ${topicCore} ${suffixes[i] || 'tutorial'}`;

    return {
      label: part.length > 40 ? part.slice(0, 37) + '...' : part,
      query: query.trim(),
    };
  });
}
