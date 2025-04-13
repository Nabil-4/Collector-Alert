// Récupérer les collectors et la position du scroll depuis le stockage
browser.storage.local.get(["previousCollectors", "scrollPosition"]).then((data) => {
  const collectors = data.previousCollectors || [];
  const scrollPosition = data.scrollPosition || 0;
  const list = document.getElementById("collector-list");

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
      img.src = collector.thumbnail;
      img.alt = collector.title;
      img.className = "collector-image";

      const price = document.createElement("span");
      price.textContent = `${collector.price.toFixed(2)}\u20AC`;
      price.className = "collector-price";

      const a = document.createElement("a");
      a.href = collector.url;
      a.textContent = collector.title;
      a.target = "_blank";
      a.className = "collector-title";
      a.title = `Voir ${collector.title} sur le site`;

      const likes = document.createElement("span");
      likes.textContent = collector.isLevelMax ? "Max" : collector.likes;
      likes.className = "collector-likes";

      imagePriceContainer.appendChild(img);
      imagePriceContainer.appendChild(price);
      div.appendChild(imagePriceContainer);
      div.appendChild(a);
      div.appendChild(likes);
      list.appendChild(div);
    });

    // Restaurer la position du scroll
    list.scrollTop = scrollPosition;
  }

  // Sauvegarder la position du scroll lors du défilement
  list.addEventListener("scroll", () => {
    browser.storage.local.set({ scrollPosition: list.scrollTop });
  });
});