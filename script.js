const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

// Hugging Face API key and model
const HF_API_KEY = "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";
const MODEL_NAME = "black-forest-labs/FLUX.1-dev";

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
];

// Theme toggle
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPreference);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Calculate image dimensions based on aspect ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.floor(Math.round(width * scaleFactor) / 16) * 16;
  let calculatedHeight = Math.floor(Math.round(height * scaleFactor) / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};

// Generate images using Hugging Face Together API
const generateImages = async (promptText, imageCount, aspectRatio) => {
  const { width, height } = getImageDimensions(aspectRatio);

  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      const response = await fetch("https://router.huggingface.co/together/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          model: MODEL_NAME,
          width,
          height,
          response_format: "b64_json",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate image");

      const data = await response.json();
      const base64 = data.data[0].b64_json;
      const imgUrl = `data:image/png;base64,${base64}`;

      // Update UI
      const imgCard = document.querySelector(`#img-card-${i}`);
      const imgEl = imgCard.querySelector("img");
      imgEl.src = imgUrl;
      imgCard.classList.remove("loading");
      imgCard.querySelector(".status-text").textContent = "Done!";

      // Download button
      const downloadBtn = imgCard.querySelector(".img-download-btn");
      downloadBtn.addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = imgUrl;
        link.download = `generated-image-${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

    } catch (error) {
      console.error("Image generation error:", error);
      const imgCard = document.querySelector(`#img-card-${i}`);
      imgCard.querySelector(".status-text").textContent = "Error!";
    }
  });

  await Promise.allSettled(imagePromises);
};

// Create image cards dynamically
const createImageCards = (promptText, imageCount, aspectRatio) => {
  gridGallery.innerHTML = "";
  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
        <img src="test.jpeg" id="img-${i}" class="result-img"/>
        <div class="img-overlay">
          <button id="download-${i}" class="img-download-btn" title="Download">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      </div>`;
  }
  generateImages(promptText, imageCount, aspectRatio);
};

// Handle form submit
const handleFormSubmit = (e) => {
  e.preventDefault();
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();
  createImageCards(promptText, imageCount, aspectRatio);
};

// Random example prompt button
promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
