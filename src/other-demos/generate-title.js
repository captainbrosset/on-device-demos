const generateButton = document.getElementById("generate-title");
const contentEl = document.getElementById("content");
const titleEl = document.getElementById("title");

let isGenerating = false;

getPromptSession().then((session) => {
  generateButton.addEventListener(
    "click",
    async () => {
      if (isGenerating) {
        return;
      }

      isGenerating = true;
      generateButton.disabled = true;
      generateButton.classList.add("processing");
      generateButton.textContent = "Generating ...";

      titleEl.value = "";
      // To avoid the previous session from being continued.
      const newSession = await session.clone();
      const stream = await session.promptStreaming(`Find a title for this blog post. Answer with the title only; don't add any other information. Make the title less than 100 characters. Don't wrap the title in quotes.\n\nBlog post: ${contentEl.value}\n\nTitle: `);
      for await (const chunk of stream) {
        titleEl.value += chunk;
      }
      
      isGenerating = false;
      generateButton.disabled = false;
      generateButton.classList.remove("processing");
      generateButton.textContent = "Generate a title based on content";
    }
  );
});
