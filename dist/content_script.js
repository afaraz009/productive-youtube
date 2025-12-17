const D=["ytd-reel-shelf-renderer","ytd-rich-shelf-renderer[is-shorts]",'[aria-label*="Shorts"]',"ytd-shells-renderer",'#dismissible[class*="shorts"]'],I=["#secondary-inner ytd-compact-video-renderer","#secondary-inner ytd-compact-playlist-renderer","#secondary-inner ytd-reel-shelf-renderer","ytd-watch-next-secondary-results-renderer","#related ytd-video-renderer","#related ytd-compact-video-renderer","#related ytd-reel-shelf-renderer",".ytd-watch-next-secondary-results-renderer #items ytd-video-renderer",".ytd-watch-next-secondary-results-renderer #items ytd-compact-video-renderer","ytd-continuation-item-renderer:has(#related)",'[data-session-link]:not([href*="/shorts/"]) > ytd-thumbnail',"ytd-item-section-renderer:has(ytd-compact-video-renderer)"],N=["ytd-rich-item-renderer","ytd-rich-grid-row","ytd-rich-grid-renderer","ytd-two-column-browse-results-renderer #primary #contents",'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer','ytd-browse[page-subtype="home"] ytd-rich-item-renderer','ytd-browse[page-subtype="home"] ytd-rich-grid-row',"ytd-grid-video-renderer","ytd-video-renderer","ytd-item-section-renderer"];let S={removeShorts:!0,removeShortsButton:!0,removeHomepageVideos:!0,removeWatchPageSuggestions:!0,showTranscript:!1};function te(e){const t=Object.keys(S);chrome.storage.local.get(t,function(r){t.forEach(o=>{r[o]!==void 0&&(S[o]=r[o])}),e&&e()})}function oe(e){const t=[],r=new Set,o=["ytd-reel-item-renderer","ytd-rich-item-renderer","ytd-video-renderer","ytd-compact-video-renderer","ytm-shorts-lockup-view-model-v2","ytm-shorts-lockup-view-model",".shortsLockupViewModelHost",'[class*="reel-item"]','[class*="rich-item"]','[class*="shortsLockup"]'],n=["#video-title","#title yt-formatted-string","h3 a span[title]",'yt-formatted-string[slot="title"]',"#video-title-link","a[title]","h3 span[title]",'[id="video-title"]',".ytd-rich-grid-media h3",".reel-item-title","[aria-label]"],a=['a[href*="/@"]:not([href*="/shorts/"]):not([href*="/watch"])','a[href*="/channel/"]:not([href*="/shorts/"]):not([href*="/watch"])','a[href*="/c/"]:not([href*="/shorts/"]):not([href*="/watch"])','.shortsLockupViewModelHostMetadataRoundedContainerContent a:not([title]):not([href*="/shorts/"])','.shortsLockupViewModelHostMetadata a:not([title]):not([href*="/shorts/"])',".ytd-rich-grid-media .details.ytd-rich-grid-media #text a",".ytd-rich-grid-media .meta.ytd-rich-grid-media #text a","#meta-contents #channel-name a",".ytd-rich-grid-media #byline a",".ytd-video-meta-block #text a","ytd-channel-name #container #text-container #text a",".ytd-channel-name a","#channel-name a","ytd-channel-name a","ytd-channel-name yt-formatted-string",".metadata-line a",".byline a","#byline a",'[aria-label*="by"] a','[aria-label*="by "]',".shortsLockupViewModelHostMetadataRoundedContainerContent span:not([title])",".shortsLockupViewModelHostMetadata span:not([title])",'.shortsLockupViewModelHostMetadataRoundedContainerContent [role="text"]:not([title])','.shortsLockupViewModelHostMetadata [role="text"]:not([title])','.shortsLockupViewModelHost [aria-label]:not([aria-label*="views"]):not([aria-label*="ago"]):not([title])'];return o.forEach(s=>{e.querySelectorAll(s).forEach(b=>{let h="",l="";for(const y of n){const c=b.querySelector(y);if(c&&(c.hasAttribute("title")?h=c.getAttribute("title")||"":c.textContent?h=c.textContent.trim():c.innerText&&(h=c.innerText.trim()),h&&h.length>0&&h!=="Shorts")){const i=h.match(/\s+by:\s*(@?\w+)/i);if(i){const d=i[1];h=h.replace(/\s+by:\s*@?\w+/i,"").trim(),l||(l=d.startsWith("@")?d:"@"+d)}break}}for(const y of a){const c=b.querySelector(y);if(c){let i="";if(c.title?i=c.title.trim():c.textContent?i=c.textContent.trim():c.innerText&&(i=c.innerText.trim()),i=i.replace(/^by\s+/i,"").trim(),!i&&c.href){const d=c.href;d.includes("/@")?(i=d.split("/@")[1].split("/")[0],i="@"+i):d.includes("/channel/")?i="":d.includes("/c/")&&(i=d.split("/c/")[1].split("/")[0])}if(i&&i.length>0&&i.length<100&&i!==h&&!i.includes(h)&&!i.includes("http")&&!i.includes("Subscribe")&&!i.includes("views")&&!i.includes("ago")&&!i.includes("#")&&!i.includes("🤯")&&!i.includes("🧊")&&!i.includes("🤣")&&!i.includes("😲")&&!i.toLowerCase().includes("short")&&!i.toLowerCase().includes("nerf")&&!i.toLowerCase().includes("economy")&&!i.toLowerCase().includes("truth")&&!i.toLowerCase().includes("military")&&!i.toLowerCase().includes("integrity")&&i!=="Shorts"){l=i;break}}}if(!l&&h){const y=b.querySelectorAll("*"),c=[];y.forEach(i=>{i.textContent&&i.textContent.trim()&&i.textContent.trim()!==h&&i.textContent.trim().length<100&&i.textContent.trim().length>2&&!i.textContent.includes("http")&&!i.textContent.includes("ago")&&!i.textContent.includes("views")&&c.push(`"${i.textContent.trim()}" (${i.tagName.toLowerCase()}.${i.className})`)}),c.length>0&&console.log("Potential channel candidates:",c.slice(0,5))}if(h&&l){const y=`${h}-${l}`;r.has(y)||(r.add(y),t.push({title:h,channel:l}))}else if(h){const y=`${h}-unknown`;r.has(y)||(r.add(y),t.push({title:h,channel:"Unknown Channel"}))}})}),t}function O(){if(!S.removeShorts){re();return}let e=0;D.forEach(t=>{document.querySelectorAll(t).forEach(o=>{const n=o;if(n&&!n.dataset.shortsRemoved){const a=oe(n);a.length>0?(console.log(`YouTube Shorts Remover: Found ${a.length} Shorts videos in shelf:`),a.forEach((s,m)=>{console.log(`  ${m+1}. "${s.title}" - ${s.channel}`)})):(console.log("YouTube Shorts Remover: No videos found in this shelf"),console.log("Shelf HTML structure:",n.innerHTML.substring(0,500)+"...")),n.dataset.shortsRemoved="true",n.style.display="none",e++,console.log(`YouTube Shorts Remover: Hidden element with selector: ${t}`)}})}),e>0&&console.log(`YouTube Shorts Remover: Hidden ${e} Shorts shelf(s)`)}function re(){let e=0;D.forEach(t=>{document.querySelectorAll(t).forEach(o=>{const n=o;n&&n.dataset.shortsRemoved&&(n.style.display="",delete n.dataset.shortsRemoved,e++)})}),e>0&&console.log(`Productive YouTube: Restored ${e} Shorts shelf(s)`)}function j(e,t,r){let o=0;e.forEach(n=>{document.querySelectorAll(n).forEach(s=>{const m=s;m&&m.dataset[t]&&(m.style.display="",delete m.dataset[t],o++)})}),o>0&&console.log(`Productive YouTube: Restored ${o} ${r}`)}function W(){if(!S.removeHomepageVideos){j(N,"homepageVideosRemoved","homepage videos");return}let e=0;N.forEach(t=>{document.querySelectorAll(t).forEach(o=>{const n=o;if(n&&!n.dataset.homepageVideosRemoved){const a=n.getAttribute("role"),s=n.getAttribute("aria-label");if(a==="navigation"||a==="banner"||s&&(s.includes("header")||s.includes("navigation")))return;n.dataset.homepageVideosRemoved="true",n.style.display="none",e++,console.log(`Homepage Videos Remover: Hidden element with selector: ${t}`)}})}),e>0&&console.log(`Homepage Videos Remover: Hidden ${e} homepage video elements`)}let $;function ne(){clearTimeout($),$=window.setTimeout(O,100)}let V;function se(){clearTimeout(V),V=window.setTimeout(W,100)}function _(){if(!S.removeWatchPageSuggestions){j(I,"suggestionsRemoved","video suggestions");return}let e=0;I.forEach(t=>{try{document.querySelectorAll(t).forEach(o=>{const n=o,a=n.closest("#items.ytd-playlist-panel-renderer")||n.closest("ytd-playlist-panel-video-renderer")||n.closest("ytd-playlist-panel-renderer")||n.id&&n.id.includes("playlist");!a&&n&&!n.dataset.suggestionsRemoved?(n.dataset.suggestionsRemoved="true",n.style.display="none",e++,console.log(`Video Suggestions Remover: Hidden element with selector: ${t}`)):a?console.log("Video Suggestions Remover: Skipped playlist item"):n&&n.dataset.suggestionsRemoved})}catch(r){const o=r instanceof Error?r.message:"Unknown error";console.log(`Video Suggestions Remover: Error with selector ${t}:`,o)}}),e>0&&console.log(`Video Suggestions Remover: Hidden ${e} video suggestion elements`)}let q;function ie(){clearTimeout(q),q=window.setTimeout(_,100)}function X(){if(!S.removeShortsButton){let o=0;document.querySelectorAll("ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer").forEach(a=>{const s=a;s&&s.dataset.shortsButtonRemoved&&(s.style.display="",delete s.dataset.shortsButtonRemoved,o++)}),o>0&&console.log(`Productive YouTube: Restored ${o} Shorts button(s)`);return}let e=0;['ytd-guide-entry-renderer:has(a[href="/shorts"])','ytd-mini-guide-entry-renderer:has(a[href="/shorts"])','ytd-guide-entry-renderer:has([title="Shorts"])','ytd-mini-guide-entry-renderer:has([title="Shorts"])'].forEach(o=>{try{document.querySelectorAll(o).forEach(a=>{const s=a;s&&!s.dataset.shortsButtonRemoved&&(s.dataset.shortsButtonRemoved="true",s.style.display="none",e++,console.log("Productive YouTube: Hidden Shorts button container"))})}catch{}}),['a[href="/shorts"]','a[title="Shorts"]'].forEach(o=>{document.querySelectorAll(o).forEach(a=>{const s=a.closest("ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer");s&&!s.dataset.shortsButtonRemoved&&(s.dataset.shortsButtonRemoved="true",s.style.display="none",e++,console.log("Productive YouTube: Hidden Shorts button via parent"))})}),e>0&&console.log(`Productive YouTube: Hidden ${e} Shorts button(s)`)}let U;function ae(){clearTimeout(U),U=window.setTimeout(X,100)}function le(){try{const t=new URLSearchParams(window.location.search).get("v");if(t)return t;const r=window.ytInitialPlayerResponse;if(r&&r.videoDetails&&r.videoDetails.videoId)return r.videoDetails.videoId;const o=document.querySelector('link[rel="canonical"]');if(o&&o.href){const a=o.href.match(/[?&]v=([^&]+)/);if(a&&a[1])return a[1];const s=o.href.match(/watch\/([a-zA-Z0-9_-]+)/);if(s&&s[1])return s[1]}const n=window.location.href.match(/[?&]v=([a-zA-Z0-9_-]+)/)||window.location.href.match(/watch\/([a-zA-Z0-9_-]+)/);if(n&&n[1])return n[1]}catch(e){console.warn("getVideoId: error while extracting video id",e)}return null}async function ce(e){console.log(`Fetching video page for video ID: ${e}`);const t=await fetch(`https://www.youtube.com/watch?v=${e}`);return console.log("fetch youtube video response is -------------------------------",t),t.text()}function de(e){const t=e.match(/"INNERTUBE_API_KEY":"([^"]+)"/);return t&&t[1]?(console.log("Productive YouTube: API key extracted successfully"),t[1]):(console.warn("Productive YouTube: Could not extract API key from video page HTML"),null)}async function ue(e,t){console.log("Productive YouTube: Fetching player API response...");const r=await fetch(`https://www.youtube.com/youtubei/v1/player?key=${t}`,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},body:JSON.stringify({context:{client:{clientName:"WEB",clientVersion:"2.20240101.00.00"}},videoId:e})});if(!r.ok)throw console.error("Productive YouTube: Player API HTTP error:",r.status),new Error(`HTTP error! status: ${r.status}`);const o=await r.json();return console.log("Productive YouTube: Player API response received, has captions:",!!(o!=null&&o.captions)),o}function me(e){var o,n,a;console.log("Productive YouTube: Extracting transcript URL...");const t=(n=(o=e==null?void 0:e.captions)==null?void 0:o.playerCaptionsTracklistRenderer)==null?void 0:n.captionTracks;if(!t||t.length===0)return console.warn("Productive YouTube: No caption tracks found in player response"),null;console.log(`Productive YouTube: Found ${t.length} caption track(s)`),t.forEach((s,m)=>{var b;console.log(`Track ${m+1}: ${s.languageCode||"unknown"} - ${((b=s.name)==null?void 0:b.simpleText)||"unknown name"}`)});let r=t.find(s=>s.baseUrl&&s.languageCode&&s.languageCode.toLowerCase().startsWith("en"));return r||(r=t.find(s=>{var m;return s.baseUrl&&((m=s.name)==null?void 0:m.simpleText)&&(s.name.simpleText.toLowerCase().includes("english")||s.name.simpleText.toLowerCase().includes("auto-generated"))})),r||(r=t.find(s=>s.baseUrl)),!r&&t.length>0&&(r=t[0]),!r||!r.baseUrl?(console.warn("Productive YouTube: Could not find caption track with baseUrl"),null):(console.log("Productive YouTube: Selected caption track:",r.languageCode||"unknown language","-",((a=r.name)==null?void 0:a.simpleText)||"no name"),r.baseUrl)}async function pe(e){try{const t=await fetch(e);if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const r=await t.text();if(!r)throw new Error("Empty transcript response");return r}catch(t){throw console.error("Productive YouTube: Error fetching transcript XML:",t),t}}function he(e){try{const r=new DOMParser().parseFromString(e,"text/xml");if(r.getElementsByTagName("parsererror").length>0)return console.error("Productive YouTube: XML parsing error"),[];const o=r.getElementsByTagName("text");if(o.length===0)return console.warn("Productive YouTube: No text nodes found in transcript XML"),[];const n=[];for(let a=0;a<o.length;a++){const s=o[a].textContent||"",m=parseFloat(o[a].getAttribute("start")||"0");s.trim()&&n.push({text:s,start:m})}return n}catch(t){return console.error("Productive YouTube: Error parsing transcript:",t),[]}}function ge(e){const t=document.createElement("textarea");return t.innerHTML=e,t.value}function fe(e){return e=e.replace(/\[music\]/gi,""),e=e.replace(/\[applause\]/gi,""),e=e.replace(/\[laughter\]/gi,""),e=e.replace(/\[.*?\]/g,""),e=e.replace(/>>+/g,""),e=e.replace(/\s+/g," "),e=e.trim(),e}function ye(e){console.log("Productive YouTube: displayTranscript function called with",e.length,"entries");let t=document.querySelector("#secondary");if(t||(console.log("Productive YouTube: #secondary not found, trying alternatives..."),t=document.querySelector("ytd-watch-next-secondary-results-renderer")),t||(console.log("Productive YouTube: ytd-watch-next-secondary-results-renderer not found, trying #secondary-inner..."),t=document.querySelector("#secondary-inner")),t||(console.log("Productive YouTube: #secondary-inner not found, trying #related..."),t=document.querySelector("#related")),!t){console.log("Productive YouTube: No sidebar found, creating fixed position container...");const g=document.createElement("div");g.id="transcript-fixed-wrapper",g.style.cssText=`
      position: fixed !important;
      top: 80px !important;
      right: 20px !important;
      width: 400px !important;
      max-height: calc(100vh - 150px) !important;
      overflow-y: auto !important;
      z-index: 9999 !important;
    `,document.body.appendChild(g),t=g,console.log("Productive YouTube: Created fixed position wrapper")}if(!t){console.error("Productive YouTube: Could not find any suitable container for transcript - giving up");return}console.log("Productive YouTube: Using container:",t.tagName||t.id||"unknown");const r=25,o=[];let n=null;e.forEach((g,v)=>{let f=ge(g.text);if(f=fe(f),!f)return;const u=Math.floor(g.start/r)*r,x=(v<e.length-1?e[v+1].start:g.start+2)-g.start,w={text:f,start:g.start,duration:x};!n||n.start!==u?(n&&o.push(n),n={start:u,lines:[w]}):n.lines.push(w)}),n&&o.push(n);let a=document.getElementById("transcript-container");a?(console.log("Productive YouTube: Reusing existing transcript container"),a.innerHTML=""):(console.log("Productive YouTube: Creating new transcript container"),a=document.createElement("div"),a.id="transcript-container",a.className="transcript-container",a.style.cssText=`
      background: transparent !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border: 3px solid #fff !important;

      border-radius: 12px !important;
      margin-bottom: 1.5rem !important;
      margin-top: 1.5rem !important;
      box-shadow: rgba(255, 255, 255, 0.9) 0px 6px 12px -2px,
            rgba(255, 255, 255, 0.6) 0px 3px 7px -3px !important;


      width: 100% !important;
      max-width: 400px !important;
      z-index: 1000 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      overflow: hidden !important;
    `,t.prepend(a),console.log("Productive YouTube: Transcript container created and inserted into DOM"));const s=document.createElement("div");s.className="transcript-header",s.style.cssText=`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 3px solid rgba(229, 231, 235, 0.6);
    cursor: pointer;
    background: linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%);
    gap: 1rem;
  `,a.appendChild(s);const m=document.createElement("div");m.className="transcript-title",m.textContent="📖 Video Transcript",m.style.cssText=`
    font-size: 16px;
    line-height: 1.5em;
    font-weight: 700;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    letter-spacing: -0.01em;
  `,s.appendChild(m);const b=document.createElement("span");b.className="transcript-arrow",b.style.cssText=`
    margin-left: 0.5rem;
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `,b.textContent="▲",m.appendChild(b);const h=document.createElement("div");h.className="transcript-header-buttons",h.style.cssText=`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    `,s.appendChild(h);const l=document.createElement("button");l.className="transcript-copy-button",l.title="Copy transcript to clipboard";const y=document.createElementNS("http://www.w3.org/2000/svg","svg");y.setAttribute("width","20"),y.setAttribute("height","20"),y.setAttribute("viewBox","0 0 24 24"),y.setAttribute("fill","none"),y.setAttribute("stroke","currentColor"),y.setAttribute("stroke-width","2"),y.setAttribute("stroke-linecap","round"),y.setAttribute("stroke-linejoin","round"),y.innerHTML=`
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  `,l.appendChild(y),l.style.cssText=`
    color: #3b82f6;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `,l.onmouseover=()=>{l.style.color="#2563eb",l.style.transform="scale(1.1)"},l.onmouseout=()=>{l.style.color="#3b82f6",l.style.transform="scale(1)"},l.onclick=g=>{g.stopPropagation();const v=o.map(u=>{const p=B(u.start),x=u.lines.map(w=>w.text).join(" ");return`[${p}] ${x}`}).join(`

`);navigator.clipboard.writeText(v),l.style.color="#10b981";const f=l.querySelector("svg");f&&(f.innerHTML=`
        <polyline points="20 6 9 17 4 12"></polyline>
      `),setTimeout(()=>{f&&(f.innerHTML=`
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        `),l.style.color="#3b82f6"},2e3)},h.appendChild(l);const c=document.createElement("button");c.className="transcript-sync-button",c.title="Scroll to current timestamp";const i=document.createElementNS("http://www.w3.org/2000/svg","svg");i.setAttribute("width","20"),i.setAttribute("height","20"),i.setAttribute("viewBox","0 0 24 24"),i.setAttribute("fill","none"),i.setAttribute("stroke","currentColor"),i.setAttribute("stroke-width","2"),i.setAttribute("stroke-linecap","round"),i.setAttribute("stroke-linejoin","round"),i.innerHTML=`
    <path d="M1 4v6h6"></path>
    <path d="M23 20v-6h-6"></path>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
  `,c.appendChild(i),c.style.cssText=`
    background: transparent;
    color: #10b981;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `,c.onmouseover=()=>{c.style.background="rgba(16, 185, 129, 0.1)",c.style.color="#059669",c.style.transform="scale(1.1)"},c.onmouseout=()=>{c.style.background="transparent",c.style.color="#10b981",c.style.transform="scale(1)"},h.appendChild(c);const d=document.createElement("div");d.className="transcript-content";const P=S.removeWatchPageSuggestions?"calc(100vh - 180px)":"24rem";d.style.cssText=`
    max-height: ${P};
    overflow-y: auto;
    padding: 1.5rem;
    background-color: transparent !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `,a.appendChild(d),c.onclick=g=>{g.stopPropagation();const v=document.querySelector("video");if(v){const f=v.currentTime,u=d.querySelector(".transcript-line.active");if(u){const p=u.offsetTop,x=d.clientHeight,w=u.clientHeight,C=p-x/2+w/2;d.scrollTo({top:C,behavior:"smooth"})}else{const p=d.querySelectorAll(".transcript-line");let x=null,w=1/0;if(p.forEach(C=>{const T=C,k=parseFloat(T.dataset.start||"0"),E=Math.abs(f-k);E<w&&(w=E,x=T)}),x){const C=x.offsetTop,T=d.clientHeight,k=x.clientHeight,E=C-T/2+k/2;d.scrollTo({top:E,behavior:"smooth"})}}}},s.onclick=()=>{d.style.display=d.style.display==="none"?"block":"none";const g=s.querySelector(".transcript-arrow");g&&(g.textContent=d.style.display==="none"?"▼":"▲")},o.forEach(g=>{const v=document.createElement("div");v.className="transcript-chunk-header",v.style.cssText=`
      color: #2563eb;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      line-height: 1.4em;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      margin-bottom: 0.75rem;
      margin-top: 1.25rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border-left: 3px solid #2563eb;
      display: inline-block;
      transition: all 0.2s ease;
      `,v.onmouseover=function(){this.style.transform="translateX(4px)"},v.onmouseout=function(){this.style.transform="translateX(0)"},v.textContent=B(g.start),v.onclick=()=>{const f=document.querySelector("video");f&&(f.currentTime=g.start)},d.appendChild(v),g.lines.forEach(f=>{const u=document.createElement("div");u.className="transcript-line",u.dataset.start=f.start.toString(),u.dataset.duration=f.duration.toString(),u.style.cssText=`
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        transition: all 0.3s ease;
        line-height: 1.6em;
      `,u.onmouseover=function(){var w;const x=document.documentElement.classList.contains("dark")||((w=document.querySelector("html"))==null?void 0:w.getAttribute("dark"))!==null||document.body.style.backgroundColor==="rgb(19, 19, 19)"||document.body.style.backgroundColor==="#131313";u.classList.contains("active")||(u.style.backgroundColor=x?"rgba(55, 65, 81, 0.5)":"rgba(243, 244, 246, 0.8)")},u.onmouseout=function(){u.classList.contains("active")||(u.style.backgroundColor="transparent")};const p=document.createElement("span");p.className="transcript-text",p.textContent=f.text,p.style.cssText=`
        color: #1f2937;
        font-size: 15px;
        line-height: 1.6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        transition: color 0.3s ease;
        cursor: pointer;
        letter-spacing: 0.01em;
        user-select: text;
        display: block;
        word-wrap: break-word;
      `,u.appendChild(p),d.appendChild(u)})});const R=g=>{g?(a.style.cssText=`
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(60, 60, 60, 0.6);
        border-radius: 12px;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      `,s.style.cssText=`
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(60, 60, 60, 0.5);
        cursor: pointer;
         background: linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%);
        gap: 1rem;
        `,m.style.cssText=`
       font-size: 16px;
        line-height: 1.5em;
        font-weight: 700;
        color: #f0f9ff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        letter-spacing: -0.01em;
      `,b.style.cssText=`
        margin-left: auto;
        color: #9ca3af;
      `,l.style.cssText=`
        color: #ffffff;
        background:transparent !important;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        white-space: nowrap;
      `,l.onmouseover=()=>{l.style.boxShadow="0 6px 20px rgba(37, 99, 235, 0.4)",l.style.transform="translateY(-2px)"},l.onmouseout=()=>{l.style.boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)",l.style.transform="translateY(0)"},d.style.cssText=`
        max-height: ${P};
        overflow-y: auto;
        padding: 1rem;
        background-color: transparent;
      `,d.querySelectorAll(".transcript-timestamp").forEach(u=>{u.style.cssText=`
          color: #60a5fa;
          font-weight: 600;
          cursor: pointer;
          margin-right: 0.75rem;
          display: inline-block;
          min-width: 50px;
          font-size: 16px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        `}),d.querySelectorAll(".transcript-text").forEach(u=>{u.style.cssText=`
          color: #e5e7eb;
          font-size: 15px;
          line-height: 1.6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-weight: 400;
          letter-spacing: 0.01em;
          display: block;
          word-wrap: break-word;
        `})):(a.style.cssText=`
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(229, 231, 235, 0.8);
        border-radius: 12px;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      `,s.style.cssText=`
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(229, 231, 235, 0.6);
        cursor: pointer;
        background: linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%);
        gap: 1rem;
      `,m.style.cssText=`
        font-size: 16px;
        line-height: 1.5em;
        font-weight: 700;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        letter-spacing: -0.01em;
      `,b.style.cssText=`
        margin-left: auto;
        color: #d1d5db;
      `,l.style.cssText=`
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: #ffffff;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        white-space: nowrap;
      `,l.onmouseover=()=>{l.style.background="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",l.style.boxShadow="0 6px 20px rgba(37, 99, 235, 0.4)",l.style.transform="translateY(-2px)"},l.onmouseout=()=>{l.style.background="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",l.style.boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)",l.style.transform="translateY(0)"},d.style.cssText=`
        max-height: ${P};
        overflow-y: auto;
        padding: 1.5rem;
        background-color: transparent;
      `,d.querySelectorAll(".transcript-timestamp").forEach(u=>{u.style.cssText=`
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          margin-right: 0.75rem;
          display: inline-block;
          min-width: 50px;
          font-size: 16px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        `}),d.querySelectorAll(".transcript-text").forEach(u=>{u.style.cssText=`
          color: #1f2937;
          font-size: 15px;
          line-height: 1.6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-weight: 400;
          letter-spacing: 0.01em;
          display: block;
          word-wrap: break-word;
        `}))},M=()=>{var g;return document.documentElement.classList.contains("dark")||((g=document.querySelector("html"))==null?void 0:g.getAttribute("dark"))!==null||document.body.style.backgroundColor==="rgb(19, 19, 19)"||document.body.style.backgroundColor==="#131313"};R(M());const L=new MutationObserver(()=>{R(M())});L.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]}),L.observe(document.body,{attributes:!0});let A=!1,Y;d.addEventListener("scroll",()=>{A=!0,clearTimeout(Y),Y=window.setTimeout(()=>{A=!1},3e3)});const H=document.querySelector("video");H&&H.addEventListener("timeupdate",()=>{const g=H.currentTime,v=d.querySelectorAll(".transcript-line"),f=M();v.forEach(u=>{const p=u,x=parseFloat(p.dataset.start||"0"),w=parseFloat(p.dataset.duration||"2"),C=x+w;if(g>=x&&g<C){p.classList.add("active");const T=p.querySelector(".transcript-text"),k=p.querySelector(".transcript-timestamp");if(p.style.cssText=`
            margin-bottom: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: baseline;
            gap: 0.75rem;
            background-color: ${f?"rgba(30, 58, 138, 0.3)":"rgba(219, 234, 254, 0.5)"};
            border-left: 4px solid #3b82f6;
          `,T&&(T.style.color=f?"#93c5fd":"#1e40af",T.style.fontWeight="500"),k&&(k.style.color="#3b82f6"),!A){const E=p.offsetTop,J=d.clientHeight,Q=p.clientHeight,ee=E-J/2+Q/2;d.scrollTo({top:ee,behavior:"smooth"})}}else{p.classList.remove("active");const T=p.querySelector(".transcript-text"),k=p.querySelector(".transcript-timestamp");p.style.cssText=`
            margin-bottom: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: baseline;
            gap: 0.75rem;
          `,T&&(T.style.color=f?"#e5e7eb":"#1f2937",T.style.fontWeight="400"),k&&(k.style.color="#2563eb"),p.onmouseover=function(){p.classList.contains("active")||(p.style.backgroundColor=f?"rgba(55, 65, 81, 0.5)":"rgba(243, 244, 246, 0.8)")},p.onmouseout=function(){p.classList.contains("active")||(p.style.backgroundColor="transparent")}}})})}function B(e){const t=new Date(0);if(t.setSeconds(e),Math.floor(e/60)<60){const o=Math.floor(e/60),n=Math.floor(e%60);return`${o.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`}else return t.toISOString().substr(11,8)}async function be(){var e,t;if(console.log("Productive YouTube: showVideoTranscript called, showTranscript setting:",S.showTranscript),!S.showTranscript){const r=document.getElementById("transcript-container");r&&(r.remove(),console.log("Productive YouTube: Transcript container removed"));return}try{console.log("Productive YouTube: Starting transcript fetch process...");const r=le();if(!r){console.warn("Productive YouTube: Could not get video ID");return}console.log("Productive YouTube: Video ID found:",r),await new Promise(m=>setTimeout(m,1e3));let o=null;if(window.ytInitialPlayerResponse)if(o=window.ytInitialPlayerResponse,console.log("Productive YouTube: Using ytInitialPlayerResponse from page"),o!=null&&o.captions){const m=((t=(e=o.captions.playerCaptionsTracklistRenderer)==null?void 0:e.captionTracks)==null?void 0:t.length)||0;console.log("Productive YouTube: Caption tracks available:",m)}else console.log("Productive YouTube: No captions object in player response");else{console.log("Productive YouTube: ytInitialPlayerResponse not found on page, fetching from API");try{const m=await ce(r),b=de(m);if(!b){console.warn("Productive YouTube: Could not extract API key from video page");return}o=await ue(r,b),console.log("Productive YouTube: Fetched player response from API successfully")}catch(m){console.error("Productive YouTube: Failed to fetch from API:",m);return}}if(!o){console.warn("Productive YouTube: No player API response received");return}console.log("Productive YouTube: Attempting to extract transcript URL...");const n=me(o);if(!n){console.warn("Productive YouTube: Could not extract transcript URL - this video may not have captions available");return}console.log("Productive YouTube: Transcript URL found, fetching XML...");const a=await pe(n),s=he(a);if(!s||s.length===0){console.warn("Productive YouTube: No transcript content parsed");return}console.log("Productive YouTube: SUCCESS - Parsed transcript with",s.length,"entries, displaying..."),ye(s),setTimeout(()=>{xe(),console.log("Productive YouTube: AI Translation feature initialized for transcript")},500)}catch(r){console.error("Productive YouTube: Error showing video transcript:",r)}}function K(){return window.location.href.includes("/watch")&&!window.location.href.includes("/shorts")}function Z(){return window.location.pathname==="/"||window.location.pathname===""}function z(){console.log("Productive YouTube: Initializing..."),te(function(){G(),new MutationObserver(t=>{let r=!1;t.forEach(o=>{if(o.addedNodes.length>0){for(let n of o.addedNodes)if(n.nodeType===Node.ELEMENT_NODE){r=!0;break}}}),r&&ve()}).observe(document.body,{childList:!0,subtree:!0}),console.log("Productive YouTube: Observer started")})}function G(){O(),X(),K()?(_(),be()):Z()&&W()}function ve(){ne(),ae(),K()?ie():Z()&&se()}chrome.storage.onChanged.addListener(function(e,t){if(t==="local"){let r=!1;for(let o in e)S.hasOwnProperty(o)&&(S[o]=e[o].newValue,console.log(`Setting ${o} changed to ${e[o].newValue}`),r=!0);r&&(console.log("Applying settings changes immediately..."),G())}});let F=!1;function xe(){if(F){console.log("Transcript selection handler already initialized, skipping...");return}console.log("Initializing transcript text selection handler..."),F=!0;let e=null,t=!1;document.addEventListener("mousedown",r=>{e=r.target,t=!1}),document.addEventListener("mousemove",r=>{e&&r.buttons===1&&e!==r.target&&(t=!0)}),document.addEventListener("mouseup",r=>{var b;const o=window.getSelection(),n=o==null?void 0:o.toString().trim(),a=r.target,s=document.getElementById("transcript-container");if(a.closest(".transcript-line, .transcript-text")!==null||s!=null&&s.contains(a)){if(n&&n.length>2&&n.length<300&&t)console.log("Showing translation popup for selected text:",n);else if(!t&&a.closest(".transcript-text")!==null&&!a.closest(".transcript-chunk-header")){const h=((b=a.textContent)==null?void 0:b.trim())||"";h&&h.length>0&&console.log("Showing translation popup for clicked text:",h)}}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",z):z();
