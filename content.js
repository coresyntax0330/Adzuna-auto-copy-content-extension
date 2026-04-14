(function () {
  const ALLOWED_HOSTS = [
    "adzuna.com.au",
    "adzuna.at",
    "adzuna.be",
    "adzuna.com.br",
    "adzuna.ca",
    "adzuna.fr",
    "adzuna.de",
    "adzuna.in",
    "adzuna.it",
    "adzuna.mx",
    "adzuna.nl",
    "adzuna.co.nz",
    "adzuna.pl",
    "adzuna.sg",
    "adzuna.co.za",
    "adzuna.es",
    "adzuna.ch",
    "adzuna.co.uk",
    "adzuna.com",
  ];

  if (!ALLOWED_HOSTS.some((host) => location.hostname.endsWith(host))) return;

  if (document.getElementById("adzuna-copy-ui")) return;

  const API_URL = "http://45.15.160.247:5000/api/bids/get-draft";
  const BID_PAGE_URL = "http://45.15.160.247:3000/bid";

  // ---------- UI ----------
  const uiWrapper = document.createElement("div");
  uiWrapper.id = "adzuna-copy-ui";
  Object.assign(uiWrapper.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "999999",
    display: "flex",
    gap: "8px",
  });

  function makeBtn(text, bg) {
    const btn = document.createElement("button");
    btn.textContent = text;
    Object.assign(btn.style, {
      padding: "10px 14px",
      background: bg,
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
    });
    return btn;
  }

  const copyBtn = makeBtn("Copy", "#111");
  const copyUrlBtn = makeBtn("Copy URL", "#444");
  const sendBtn = makeBtn("Send", "#279b37");

  uiWrapper.append(copyBtn, copyUrlBtn, sendBtn);
  document.body.appendChild(uiWrapper);

  // ---------- HELPERS ----------
  function getInnerText(el) {
    return el?.innerText?.trim() || "";
  }

  function collectText() {
    const root = document.querySelector(".ui-adp-content");
    if (!root) return "";

    const section1 = root.querySelector(
      ":scope > .pt-4.px-4.md\\:p-4.flex.gap-1.mb-2.md\\:px-0",
    );

    const section2 = root.querySelector(
      ":scope > .lg\\:flex.mb-4 > .flex-grow",
    );

    return [getInnerText(section1), getInnerText(section2)]
      .filter(Boolean)
      .join("\n\n");
  }

  // ---------- COPY CONTENT ----------
  copyBtn.onclick = async () => {
    copyBtn.textContent = "Loading…";

    try {
      const text = collectText();
      if (!text) throw new Error("No content found");

      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
    } catch {
      copyBtn.textContent = "Failed";
    } finally {
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1500);
    }
  };

  // ---------- COPY URL ----------
  copyUrlBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyUrlBtn.textContent = "URL Copied!";
    } catch {
      copyUrlBtn.textContent = "Failed";
    } finally {
      setTimeout(() => {
        copyUrlBtn.textContent = "Copy URL";
      }, 1500);
    }
  };

  // ---------- SEND TO API + OPEN TAB ----------
  sendBtn.onclick = async () => {
    sendBtn.textContent = "Sending…";

    const payload = {
      url: location.href,
      content: collectText(),
    };

    if (!payload.url || !payload.content) {
      sendBtn.textContent = "Empty data";
      setTimeout(() => {
        sendBtn.textContent = "Send";
      }, 1500);
      return;
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: "fetchData",
        url: API_URL,
        method: "POST",
        body: payload,
      });

      if (!res || !res.success) {
        throw new Error(res?.error || "API error");
      }

      const data = res.data;
      const flag = data.flag;

      if (flag) {
        window.open(BID_PAGE_URL + "?draftID=" + data.draftID, "_blank");
        sendBtn.textContent = "Opened!";
      } else {
        sendBtn.textContent = "No Data";
      }
    } catch {
      sendBtn.textContent = "Error";
    } finally {
      setTimeout(() => {
        sendBtn.textContent = "Send";
      }, 1500);
    }
  };

  // ---------- KEEP UI ALIVE ----------
  new MutationObserver(() => {
    if (!document.getElementById("adzuna-copy-ui")) {
      document.body.appendChild(uiWrapper);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
