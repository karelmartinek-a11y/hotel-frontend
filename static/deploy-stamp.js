(function () {
  var lines = [
    "Hotel Frontend: 0121521",
    "Hotel Backend: 47f18a4",
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var badge = document.createElement("div");
    badge.className = "deployment-badge";
    badge.setAttribute("aria-label", "Informace o aktuálním nasazení");
    lines.forEach(function (line) {
      var lineEl = document.createElement("div");
      lineEl.textContent = line;
      badge.appendChild(lineEl);
    });
    document.body.appendChild(badge);
  });
})();
