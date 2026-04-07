// Parser functions for transcript XML

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCharCode(parseInt(dec, 10))
    );
}

export function parseTranscript(xml: string): { text: string; start: number }[] {
  try {
    // Try srv3 format first: <p t="ms" d="ms"><s>text</s></p>
    const srv3Regex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    const srv3Results: { text: string; start: number }[] = [];
    let srv3Match;
    while ((srv3Match = srv3Regex.exec(xml)) !== null) {
      const startMs = parseInt(srv3Match[1], 10);
      const rawText = srv3Match[3].replace(/<\/?s[^>]*>/g, "").trim();
      const text = decodeHtmlEntities(rawText);
      if (text) {
        srv3Results.push({ text, start: startMs / 1000 });
      }
    }
    if (srv3Results.length > 0) {
      return srv3Results;
    }

    // Classic format: <text start="s" dur="s">content</text>
    const classicRegex = /<text start="([^"]*)" dur="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
    const classicResults: { text: string; start: number }[] = [];
    let classicMatch;
    while ((classicMatch = classicRegex.exec(xml)) !== null) {
      const start = parseFloat(classicMatch[1]);
      const text = decodeHtmlEntities(classicMatch[3].trim());
      if (text) {
        classicResults.push({ text, start });
      }
    }
    if (classicResults.length > 0) {
      return classicResults;
    }

    // Fallback: DOMParser approach
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

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
        transcript.push({ text, start });
      }
    }
    return transcript;
  } catch (error) {
    return [];
  }
}
