// URL de base
const BASE_URL = "https://chocobonplan.com/bons-plans/c/editions-collectors/";
const DOMAIN = "https://chocobonplan.com";

// Intervalle de vérification (en minutes)
const CHECK_INTERVAL_MINUTES = 5;

// Fonction pour convertir une URL relative en absolue
function toAbsoluteUrl(relativeUrl) {
  if (!relativeUrl) return `${DOMAIN}/bons-plans/c/editions-collectors/`; // Fallback
  if (relativeUrl.startsWith("http")) return relativeUrl; // Déjà absolue
  const cleanUrl = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
  return `${DOMAIN}${cleanUrl}`;
}

// Fonction pour extraire une URL d'image valide
function getImageUrl(imageElement) {
  if (!imageElement) return "";
  const src = imageElement.getAttribute("src") || "";
  const lazySrc = imageElement.getAttribute("data-lazy-src") || "";
  const srcset = imageElement.getAttribute("srcset") || "";
  
  if (src && src.startsWith("http")) return src;
  if (lazySrc && lazySrc.startsWith("http")) return lazySrc;
  if (srcset) {
    const firstUrl = srcset.split(",")[0].trim().split(" ")[0];
    if (firstUrl.startsWith("http")) return firstUrl;
  }
  return "https://chocobonplan.com/wp-content/uploads/placeholder.png"; // Fallback
}

// Fonction pour récupérer les collectors sur une page donnée
async function fetchCollectorsFromPage(page = 1) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}page/${page}/?orderby=date`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Erreur HTTP sur la page ${page} : ${response.status}`);
      return { collectors: [], hasNextPage: false };
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Vérifier s'il y a une page suivante
    const hasNextPage = !!doc.querySelector(`a[href*='page/${page + 1}/']`);

    // Sélectionner les blocs de collectors
    const collectorBlocks = doc.querySelectorAll("article.box-corner.box-bp");
    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
    
    const collectors = Array.from(collectorBlocks)
      .map((block) => {
        // Titre
        const titleElement = block.querySelector(".box-corner__title");
        const title = titleElement?.textContent.trim() || "";

        // URL
        const urlElement = titleElement?.closest("a");
        const rawUrl = urlElement?.getAttribute("href") || "";
        const url = toAbsoluteUrl(rawUrl);

        // Vignette
        const imageElement = block.querySelector(".box-corner__img img");
        const thumbnail = getImageUrl(imageElement) || "https://chocobonplan.com/wp-content/uploads/placeholder.png";

        // Prix actuel
        const priceElement = block.querySelector(".price__promotion");
        const priceText = priceElement?.textContent.trim().replace(" €", "") || "0";
        const price = parseFloat(priceText) || 0;

        // Score (likes) et Niveau max
        let likes = 0;
        const levelMaxElement = block.querySelector(".box-corner__right img[src*='level-max.png']");
        const isLevelMax = !!levelMaxElement;
        if (isLevelMax) {
          likes = 200; // "Niveau max" = 200
        } else {
          const likesElement = block.querySelector(".progress-radial__circle__overlay");
          const likesText = likesElement?.textContent.trim() || "0";
          likes = parseInt(likesText, 10) || 0;
        }

        // Date
        const dateElement = block.querySelector("footer time");
        const datetime = dateElement?.getAttribute("datetime") || "2025-04-13"; // Fallback à aujourd'hui
        const postDate = new Date(datetime);
        const isOlderThan7Days = postDate < sevenDaysAgo && !isNaN(postDate);
        console.log(`Collector: ${title}, Date extraite: ${datetime}, Valide: ${!isNaN(postDate)}, Likes: ${likes}, Niveau max: ${isLevelMax}, Plus de 7 jours: ${isOlderThan7Days}`);

        return { title, url, thumbnail, likes, price, postDate: postDate.toISOString(), isOlderThan7Days, isLevelMax };
      })
      .filter((collector) => {
        // Vérifier titre et likes
        if (!collector.title) return false;
        const meetsLikes = collector.likes >= 200; // Strictement >= 200 ou Niveau max
        console.log(`Filtre - ${collector.title}: Likes=${collector.likes} (>=200), Gardé=${meetsLikes}`);
        return meetsLikes;
      });

    console.log(`Collectors trouvés sur page ${page} :`, collectors);
    return { collectors, hasNextPage };
  } catch (error) {
    console.error(`Erreur lors de la récupération de la page ${page} :`, error);
    return { collectors: [], hasNextPage: false };
  }
}

// Fonction pour récupérer les collectors
async function fetchCollectors() {
  let allCollectors = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage && allCollectors.length < 50) {
    const { collectors, hasNextPage: nextPageExists } = await fetchCollectorsFromPage(page);
    allCollectors = [...allCollectors, ...collectors];
    hasNextPage = nextPageExists;
    page++;
  }

  console.log(`Total collectors qualifiés : ${allCollectors.length}`);
  return allCollectors.slice(0, 50); // Limite à 50
}

// Fonction pour vérifier les nouveaux collectors
async function checkForNewCollectors() {
  const newCollectors = await fetchCollectors();
  console.log("Nouveaux collectors stockés :", newCollectors);

  // Récupérer l'état précédent
  browser.storage.local.get("previousCollectors").then((data) => {
    const previousCollectors = data.previousCollectors || [];
    const previousUrls = previousCollectors.map((c) => c.url);

    // Détecter les nouveaux collectors
    const addedCollectors = newCollectors.filter(
      (collector) => !previousUrls.includes(collector.url)
    );

    // Envoyer une notification si nouveaux collectors
    if (addedCollectors.length > 0) {
      console.log("Notification envoyée pour :", addedCollectors);
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/icon-48.png"),
        title: "Nouvelle Édition Collector !",
        message: `${addedCollectors.length} nouvelle(s) édition(s) détectée(s) : ${addedCollectors
          .map((c) => c.title)
          .join(", ")}`
      });
    }

    // Mettre à jour le stockage
    browser.storage.local.set({ previousCollectors: newCollectors });
  });
}

// Créer une alarme
browser.alarms.create("checkCollectors", {
  periodInMinutes: CHECK_INTERVAL_MINUTES
});

// Écouter les alarmes
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkCollectors") {
    checkForNewCollectors();
  }
});

// Vérifier au démarrage
checkForNewCollectors();