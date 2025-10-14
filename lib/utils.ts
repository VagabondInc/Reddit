export function titleFromPrompt(prompt: string): string {
  // If prompt starts with "Make a Song About", convert to "My ..."
  const m = prompt.match(/make a song about\s+(.*)/i);
  if (m && m[1]) {
    const subject = m[1].trim().replace(/[.]+$/g, '');
    // Capitalize first letter
    return `My ${subject.charAt(0).toUpperCase()}${subject.slice(1)}`;
  }
  // Fallback: use the original prompt
  return prompt.trim();
}

