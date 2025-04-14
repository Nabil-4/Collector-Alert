// popup.js

// Fonction pour charger et afficher les collectors
function loadCollectors(showFeedback = false) {
  browser.storage.local.get(["previousCollectors", "scrollPosition"], (data) => {
    const collectors = Array.isArray(data.previousCollectors) ? data.previousCollectors : [];
    const scrollPosition = Number(data.scrollPosition) || 0;
    const list = document.getElementById("collector-list");

    if (!list) return;

    // Vider la liste avant de recharger
    list.innerHTML = "";

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
        price.innerHTML = `${(collector.price || 0).toFixed(2)} \u20AC`;
        price.className = "collector-price";

        const a = document.createElement("a");
        a.href = collector.url || "#";
        a.textContent = (collector.title || "Sans titre").replace(/[\n\s]+/g, " ").trim();
        a.target = "_blank";
        a.className = "collector-title";
        a.title = `Voir ${collector.title || "collector"} sur le site`;

        const likes = document.createElement("span");
        likes.className = "collector-likes";
        const likeText = document.createElement("span");
        likeText.textContent = collector.isLevelMax ? "Max" : (collector.likes || 0);
        const likeIcon = document.createElement("span");
        likeIcon.className = "like-icon";
        likeIcon.textContent = collector.isLevelMax ? "\u2605" : "\u2764"; // ★ ou ❤
        likes.appendChild(likeText);
        likes.appendChild(likeIcon);

        imagePriceContainer.appendChild(img);
        imagePriceContainer.appendChild(price);
        div.appendChild(imagePriceContainer);
        div.appendChild(a);
        div.appendChild(likes);
        list.appendChild(div);
      });

      list.scrollTop = scrollPosition;
    }

    // Afficher le feedback si demandé
    if (showFeedback) {
      let feedback = document.getElementById("feedback-message");
      if (!feedback) {
        feedback = document.createElement("div");
        feedback.id = "feedback-message";
        feedback.textContent = "Liste actualisée !";
        list.insertAdjacentElement("beforebegin", feedback);
      }
      feedback.classList.add("show");
      setTimeout(() => {
        feedback.classList.remove("show");
      }, 3000); // Disparaît après 3 secondes
    }
  });
}

// Réinitialiser le badge lors de l'ouverture de la popup
browser.storage.local.set({ newCollectorCount: 0 }, () => {
  browser.action.setBadgeText({ text: "" });
});

// Charger les collectors au démarrage
loadCollectors();

// Sauvegarde de la position du scroll
const list = document.getElementById("collector-list");
if (list) {
  list.addEventListener("scroll", () => {
    const scrollTop = list.scrollTop;
    browser.storage.local.set({ scrollPosition: scrollTop });
  });
}

// Bouton d'actualisation
const refreshButton = document.getElementById("refresh-button");
if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    loadCollectors(true); // Passer true pour afficher le feedback
  });
}