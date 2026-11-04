
const GEMINI_API_KEY = "ضعي_مفتاح_GEMINI_هنا";
const GEMINI_MODEL = "gemini-3.8-flash";

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

// ===============================
// ASSISTANT IA - GEMINI DIRECT
// ===============================

const assistantInput = document.getElementById("assistantInput");
const assistantBtn = document.getElementById("assistantBtn");
const assistantResult = document.getElementById("assistantResult");

const conversation = [];

async function askGemini(question) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Tu es Imane Architecture, une assistante experte
en architecture, urbanisme, design, construction, matériaux,
histoire de l'architecture, conception durable et analyse spatiale.

Réponds dans la langue de l'utilisateur : arabe, darija algérienne
ou français.

Explique les notions difficiles étape par étape.
Donne des exemples architecturaux concrets.
Ne fabrique jamais de références scientifiques ou de normes.
Pour les questions structurelles et de sécurité, précise qu'une
validation par un ingénieur qualifié est nécessaire.`
          }]
        },
        contents: [
          ...conversation,
          {
            role: "user",
            parts: [{ text: question }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Erreur de connexion à Gemini"
    );
  }

  const answer = data.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("");

  if (!answer) {
    throw new Error("Aucune réponse reçue.");
  }

  conversation.push(
    { role: "user", parts: [{ text: question }] },
    { role: "model", parts: [{ text: answer }] }
  );

  return answer;
}

if (assistantBtn) {
  assistantBtn.addEventListener("click", async () => {
    const question = assistantInput.value.trim();

    if (!question) {
      assistantResult.textContent = "اكتبي سؤالك أولاً.";
      return;
    }

    if (
      !GEMINI_API_KEY ||
      GEMINI_API_KEY === "ضعي_مفتاح_GEMINI_هنا"
    ) {
      assistantResult.textContent =
        "أضيفي مفتاح Gemini في أعلى الملف أولاً.";
      return;
    }

    assistantBtn.disabled = true;
    assistantBtn.textContent = "جاري التفكير...";
    assistantResult.textContent = "لحظة، نبحث عن أفضل إجابة...";

    try {
      const answer = await askGemini(question);
      assistantResult.textContent = answer;
      assistantInput.value = "";
    } catch (error) {
      assistantResult.textContent =
        "حدث خطأ: " + error.message;
    } finally {
      assistantBtn.disabled = false;
      assistantBtn.textContent = "Envoyer";
    }
  });
}

// ===============================
// RECHERCHE ACADEMIQUE - CROSSREF
// ===============================

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
    researchStatus.textContent =
      "Veuillez écrire un sujet de recherche.";
    return;
  }

  researchBtn.disabled = true;
  researchBtn.textContent = "Recherche...";
  researchStatus.textContent = "Recherche scientifique...";
  researchResults.replaceChildren();

  try {
    const url =
      "https://api.crossref.org/works?query=" +
      encodeURIComponent(query) +
      "&rows=15&select=title,author,published,DOI,publisher,URL";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Erreur du service Crossref.");
    }

    const data = await response.json();
    const articles = data.message.items || [];

    if (!articles.length) {
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
            [author.given, author.family]
              .filter(Boolean)
              .join(" ")
          )
          .join(", ");

      const publisher = document.createElement("p");
      publisher.textContent =
        "Éditeur : " + (article.publisher || "Non indiqué");

      const year = document.createElement("p");
      year.textContent =
        "Année : " +
        (article.published?.["date-parts"]?.[0]?.[0]
          || "Non indiquée");

      const link = document.createElement("a");
      link.textContent = "Consulter la référence ↗";
      link.href = article.URL ||
        (article.DOI ? "https://doi.org/" + article.DOI : "#");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.style.color = "#65caff";

      card.append(title, authors, publisher, year, link);
      researchResults.appendChild(card);
    });

  } catch (error) {
    researchStatus.textContent =
      "Erreur de recherche. Vérifiez Internet.";
  } finally {
    researchBtn.disabled = false;
    researchBtn.textContent = "Rechercher";
  }
}

console.log("Imane Architecture est prêt !");
