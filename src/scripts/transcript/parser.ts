// Parser functions for transcript XML

export function parseTranscript(xml: string): { text: string; start: number }[] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

    // Check for XML parsing errors
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      return [];
    }

    const textNodes = xmlDoc.getElementsByTagName("text");
    if (textNodes.length === 0) {
      return [];
    }

    const transcript = [];
    for (let i = 0; i < textNodes.length; i++) {
      const text = textNodes[i].textContent || "";
      const start = parseFloat(textNodes[i].getAttribute("start") || "0");
      if (text.trim()) {
        // Only add non-empty text
        transcript.push({ text, start });
      }
    }
    return transcript;
  } catch (error) {
    return [];
  }
}
