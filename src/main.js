
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleMenu() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

menuBtn.addEventListener("click", toggleMenu);
overlay.addEventListener("click", toggleMenu);

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const selectedPage = document.getElementById(pageId);

  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  sidebar.classList.remove("open");
  overlay.classList.remove("show");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

showPage("home");

// RECHERCHE SCIENTIFIQUE VIA CROSSREF

const researchBtn = document.getElementById("researchBtn");
const researchInput = document.getElementById("researchInput");
const researchResults = document.getElementById("researchResults");
const researchStatus = document.getElementById("researchStatus");

if (researchBtn) {
  researchBtn.addEventListener("click", searchAcademic);
}

if (researchInput) {
  researchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") searchAcademic();
  });
}

async function searchAcademic() {
  const query = researchInput.value.trim();

  if (!query) {
    researchStatus.textContent = "Veuillez écrire un sujet de recherche.";
    return;
  }

  researchBtn.disabled = true;
  researchBtn.textContent = "Recherche en cours...";
  researchStatus.textContent = "Connexion à la base scientifique...";
  researchResults.innerHTML = "";

  try {
    const url =
      "https://api.crossref.org/works?query=" +
      encodeURIComponent(query) +
      "&rows=15&select=title,author,published,DOI,publisher,URL";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Erreur du serveur scientifique.");
    }

    const data = await response.json();
    const articles = data.message.items || [];

    if (articles.length === 0) {
      researchStatus.textContent = "Aucun résultat trouvé.";
      return;
    }

    researchStatus.textContent =
      articles.length + " références trouvées.";

    articles.forEach(article => {
      const card = document.createElement("article");
      card.className = "page";
      card.style.marginBottom = "12px";

      const title = document.createElement("h3");
      title.textContent =
        article.title?.[0] || "Titre non disponible";

      const authors = document.createElement("p");
      authors.textContent =
        "Auteurs : " +
        (article.author || [])
          .slice(0, 4)
          .map(author =>
            [author.given, author.family].filter(Boolean).join(" ")
          )
          .join(", ");

      const publisher = document.createElement("p");
      publisher.textContent =
        "Éditeur : " + (article.publisher || "Non indiqué");

      const year = document.createElement("p");
      year.textContent =
        "Année : " +
        (article.published?.["date-parts"]?.[0]?.[0] || "Non indiquée");

      const link = document.createElement("a");
      link.textContent = "Consulter la référence ↗";
      link.href = article.URL || (
        article.DOI ? "https://doi.org/" + article.DOI : "#"
      );
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.style.color = "#65caff";

      card.append(title, authors, publisher, year, link);
      researchResults.appendChild(card);
    });

  } catch (error) {
    researchStatus.textContent =
      "Impossible de récupérer les résultats. Vérifiez votre connexion Internet.";
  } finally {
    researchBtn.disabled = false;
    researchBtn.textContent = "Rechercher";
  }
}

console.log("Imane Architecture est prêt !");
