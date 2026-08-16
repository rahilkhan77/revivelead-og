(function () {
  var script = document.currentScript;
  var key = script && script.getAttribute("data-widget-key");
  if (!key) return;
  var origin = script.src.replace(/\/widget\.js.*$/, "");
  var sessionId = null;
  var open = false;

  var button = document.createElement("button");
  button.setAttribute("aria-label", "Chat with ReviveLead");
  button.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483000;width:56px;height:56px;border-radius:999px;border:0;background:#c9a227;color:#111;font:600 14px/1 system-ui;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)";
  button.textContent = "RL";

  var panel = document.createElement("div");
  panel.style.cssText =
    "display:none;position:fixed;right:20px;bottom:88px;z-index:2147483000;width:min(380px,calc(100vw-24px));height:520px;background:#111;color:#f5f5f4;border:1px solid #333;border-radius:16px;overflow:hidden;font:14px/1.45 system-ui";
  panel.innerHTML =
    '<div style="padding:14px 16px;border-bottom:1px solid #333"><strong>ReviveLead</strong><div style="opacity:.7;font-size:12px">Find the right home. Talk to an advisor when you are ready.</div></div>' +
    '<div id="rl-log" style="height:360px;overflow:auto;padding:12px 16px"></div>' +
    '<form id="rl-form" style="display:flex;gap:8px;padding:12px;border-top:1px solid #333"><input id="rl-input" placeholder="Ask about an area or budget" style="flex:1;border-radius:10px;border:1px solid #333;background:#1a1a1a;color:#fff;padding:10px"/><button style="border:0;border-radius:10px;background:#c9a227;color:#111;padding:0 12px;font-weight:600">Send</button></form>';

  function add(role, text) {
    var log = panel.querySelector("#rl-log");
    var row = document.createElement("div");
    row.style.margin = "0 0 10px";
    row.innerHTML = '<div style="opacity:.6;font-size:11px">' + role + '</div><div>' + text.replace(/</g, "&lt;") + "</div>";
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  button.onclick = function () {
    open = !open;
    panel.style.display = open ? "block" : "none";
    if (open && !sessionId) add("ReviveLead", "Hi — I can help you find matching homes. What area are you looking in?");
  };

  panel.querySelector("#rl-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var input = panel.querySelector("#rl-input");
    var message = (input.value || "").trim();
    if (!message) return;
    input.value = "";
    add("You", message);
    add("ReviveLead", "…");
    fetch(origin + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetKey: key, sessionId: sessionId, message: message }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        sessionId = data.sessionId || sessionId;
        var log = panel.querySelector("#rl-log");
        if (log.lastChild) log.removeChild(log.lastChild);
        add("ReviveLead", data.reply || "I can keep helping — what budget and area should I use?");
        (data.properties || []).forEach(function (item) {
          add("Listing", item.title + " · " + item.location + " · " + (item.currency || "AED") + " " + (item.price || ""));
        });
      })
      .catch(function () {
        var log = panel.querySelector("#rl-log");
        if (log.lastChild) log.removeChild(log.lastChild);
        add("ReviveLead", "Something went wrong. Please try again or ask to speak with an agent.");
      });
  });

  document.body.appendChild(button);
  document.body.appendChild(panel);
})();
