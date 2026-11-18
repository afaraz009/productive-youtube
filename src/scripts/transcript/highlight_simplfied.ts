export function setupSelectionHighlight(content: HTMLElement): void {
    const tooltip = createTooltip();   
    document.body.appendChild(tooltip);
    content.addEventListener("mouseup", () => {
        //get highlighted text
        const selection = window.getSelection();
        //get start and end coordinates
        const range = selection?.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // place the tooltip above the selection
        tooltip.style.position="fixed";
        tooltip.style.top = `${rect.top - 40}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.display = 'block';
    });
}

function createTooltip(): HTMLElement {
  // a small absolutely/fixed-positioned div with a "Highlight" button, display: none by default
  const div = document.createElement("div");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Highlight";
  div.appendChild(button);
  div.style.display = "none";
  return div;
}