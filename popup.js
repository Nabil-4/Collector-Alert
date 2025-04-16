// popup.js

// Fonction pour charger et afficher les collectors
function loadCollectors(showFeedback = false, isError = false) {
  browser.storage.local.get(["previousCollectors", "scrollPosition"], (data) => {
    const collectors = Array.isArray(data.previousCollectors) ? data.previousCollectors : [];
    const scrollPosition = Number(data.scrollPosition) || 0;
    const list = document.getElementById("collector-list");

    if (!list) return;

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
        likeText.textContent = collector.isLevelMax ? "Max " : (collector.likes + " " || 0);
        const likeIcon = document.createElement("span");
        likeIcon.className = "like-icon";
        likeIcon.textContent = collector.isLevelMax ? "\u2605" : "\u2764";
        likes.appendChild(likeText);
        likes.appendChild(likeIcon);

        imagePriceContainer.appendChild(img);
        imagePriceContainer.appendChild(price);
        div.appendChild(imagePriceContainer);
        div.appendChild(a);
        div.appendChild(likes);
        list.appendChild(div);

        // Gestionnaire pour l'image agrandie
        img.addEventListener("mouseenter", () => {
          const existingEnlarged = document.querySelector(".enlarged-image");
          if (existingEnlarged) existingEnlarged.remove();

          const enlargedImg = document.createElement("img");
          enlargedImg.src = img.src;
          enlargedImg.className = "enlarged-image";
          document.body.appendChild(enlargedImg);

          const imgRect = img.getBoundingClientRect();
          const popupRect = document.body.getBoundingClientRect();
          const enlargedWidth = 180;
          const enlargedHeight = 180;
          let left = imgRect.left + imgRect.width + 10;
          let top = imgRect.top;

          if (left + enlargedWidth > popupRect.left + 380) {
            left = imgRect.left - enlargedWidth - 10;
          }
          if (left < popupRect.left + 10) left = popupRect.left + 10;
          if (top + enlargedHeight > popupRect.top + popupRect.height - 10) {
            top = popupRect.top + popupRect.height - enlargedHeight - 10;
          }
          if (top < popupRect.top + 10) top = popupRect.top + 10;

          enlargedImg.style.left = `${left}px`;
          enlargedImg.style.top = `${top}px`;

          setTimeout(() => {
            enlargedImg.classList.add("visible");
          }, 0);
        });

        img.addEventListener("mouseleave", () => {
          const enlargedImg = document.querySelector(".enlarged-image");
          if (enlargedImg) {
            enlargedImg.classList.remove("visible");
            setTimeout(() => enlargedImg.remove(), 200);
          }
        });
      });

      list.scrollTop = scrollPosition;
    }

    if (showFeedback) {
      let feedback = document.getElementById("feedback-message");
      if (!feedback) {
        feedback = document.createElement("div");
        feedback.id = "feedback-message";
        list.insertAdjacentElement("beforebegin", feedback);
      }
      feedback.textContent = isError ? "Erreur lors de l'actualisation." : "Liste actualisée !";
      feedback.classList.add("show");
      setTimeout(() => {
        feedback.classList.remove("show");
      }, 3000);
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
  // Créer l'élément de l'animation de chargement
  const loadingSpinner = document.createElement("div");
  loadingSpinner.className = "loading-spinner";
  refreshButton.parentNode.insertBefore(loadingSpinner, refreshButton.nextSibling);

  refreshButton.addEventListener("click", () => {
    // Masquer le bouton et afficher l'animation
    refreshButton.style.display = "none";
    loadingSpinner.style.display = "block";

    // Envoyer un message à background.js
    browser.runtime.sendMessage({ action: "checkForNewCollectors" }, (response) => {
      // Restaurer le bouton et masquer l'animation
      refreshButton.style.display = "block";
      loadingSpinner.style.display = "none";

      if (response && response.status === "success") {
        loadCollectors(true); // Rafraîchir l'affichage
      } else {
        loadCollectors(true, true); // Afficher un message d'erreur
      }
    });
  });
}