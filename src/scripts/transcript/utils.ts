// Utility functions for transcript

export function getVideoId(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const v = urlParams.get("v");
    if (v) return v;

    // Try global player response (works on many YouTube pages)
    // @ts-ignore
    const yipr = (window as any).ytInitialPlayerResponse;
    if (yipr && yipr.videoDetails && yipr.videoDetails.videoId) {
      return yipr.videoDetails.videoId;
    }

    // Try canonical link or meta tags
    const canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (canonical && canonical.href) {
      const m = canonical.href.match(/[?&]v=([^&]+)/);
      if (m && m[1]) return m[1];
      // fallback: sometimes canonical contains full watch path
      const p = canonical.href.match(/watch\/([a-zA-Z0-9_-]+)/);
      if (p && p[1]) return p[1];
    }

    // Fallback: try to parse from the URL directly
    const fromHref =
      window.location.href.match(/[?&]v=([a-zA-Z0-9_-]+)/) ||
      window.location.href.match(/watch\/([a-zA-Z0-9_-]+)/);
    if (fromHref && fromHref[1]) return fromHref[1];
  } catch (e) {
    console.warn("getVideoId: error while extracting video id", e);
  }

  return null;
}

export function formatTimestamp(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(seconds);

  // Get total minutes to determine format
  const totalMinutes = Math.floor(seconds / 60);

  if (totalMinutes < 60) {
    // Less than 1 hour - use MM:SS format
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  } else {
    // 1 hour or more - use HH:MM:SS format
    return date.toISOString().substr(11, 8);
  }
}

// Helper function to decode HTML entities
export function decodeHtmlEntities(text: string): string {
  const textArea = document.createElement("textarea");
  textArea.innerHTML = text;
  return textArea.value;
}

// Helper function to clean transcript text
export function cleanTranscriptText(text: string): string {
  // Remove [Music], [Applause], and similar tags
  text = text.replace(/\[music\]/gi, "");
  text = text.replace(/\[applause\]/gi, "");
  text = text.replace(/\[laughter\]/gi, "");
  text = text.replace(/\[.*?\]/g, ""); // Remove any other bracketed content

  // Remove >> symbols (speaker indicators)
  text = text.replace(/>>+/g, "");

  // Remove multiple spaces
  text = text.replace(/\s+/g, " ");

  // Remove leading/trailing spaces
  text = text.trim();

  return text;
}

// Function to determine if we're on a video watch page
export function isWatchPage(): boolean {
  return (
    window.location.href.includes("/watch") &&
    !window.location.href.includes("/shorts")
  );
}

// Function to determine if we're on the homepage
export function isHomePage(): boolean {
  return window.location.pathname === "/" || window.location.pathname === "";
}
