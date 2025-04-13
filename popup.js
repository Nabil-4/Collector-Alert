// popup.js

browser.storage.local.get(["previousCollectors", "scrollPosition"], (data) => {
  const collectors = Array.isArray(data.previousCollectors) ? data.previousCollectors : [];
  const scrollPosition = Number(data.scrollPosition) || 0;
  const list = document.getElementById("collector-list");

  if (!list) return;

  if (collectors.length === 0) {
    const div = document.createElement("div");
    div.className = "empty-message";
    div.textContent = "Aucun collector détecté.";
    list.appendChild(div);
  } else {
    collectors.forEach((collector) => {
      const div = document.createElement("div");
      div.className = `collector-item ${collector.isOlderThan7Days ? "older-collector" : ""} ${collector.isLevelMax ? "level-max" : ""}`;

      const imagePriceContainer = document.createElement("div");
      imagePriceContainer.className = "image-price-container";

      const img = document.createElement("img");
      img.src = collector.thumbnail || "https://chocobonplan.com/wp-content/uploads/placeholder.png";
      img.alt = collector.title || "Collector";
      img.className = "collector-image";

      const price = document.createElement("span");
      price.textContent = `${(collector.price || 0).toFixed(2)}\u20ac`;
      price.className = "collector-price";

      const a = document.createElement("a");
      a.href = collector.url || "#";
      a.textContent = (collector.title || "Sans titre").replace(/[\n\s]+/g, " ").trim();
      a.target = "_blank";
      a.className = "collector-title";
      a.title = `Voir ${collector.title || "collector"} sur le site`;

      const likes = document.createElement("span");
      likes.textContent = collector.isLevelMax ? "Max" : (collector.likes || 0);
      likes.className = "collector-likes";

      imagePriceContainer.appendChild(img);
      imagePriceContainer.appendChild(price);
      div.appendChild(imagePriceContainer);
      div.appendChild(a);
      div.appendChild(likes);
      list.appendChild(div);
    });

    list.scrollTop = scrollPosition;
  }

  list.addEventListener("scroll", () => {
    const scrollTop = list.scrollTop;
    browser.storage.local.set({ scrollPosition: scrollTop });
  });
});