const promptEl = document.querySelector("#prompt");
const systemPromptEl = document.querySelector("#system-prompt");
const initialPromptsEl = document.querySelector("#initial-prompts");
const topKEl = document.querySelector("#top-k");
const temperatureEl = document.querySelector("#temperature");
const runBtn = document.querySelector("#run");
const stopBtn = document.querySelector("#stop");
const nShotExampleEl = document.querySelector("#n-shot-example");
const outputEl = document.querySelector("#output");
const spinnerEl = createSpinner();

const EXAMPLE_PROMPTS = [
  {
    prompt: "Recommend me three different travel destinations for my next vacation.",
    system: "You are a friendly, helpful travel assistant."
  },
  {
    prompt: "What are nice recipes if I want to cook something with chicken?",
    system: "You are friendly, helpful assistant, specialized in cooking. The user is not a professional cook, so the recipes should be easy to follow."
  },
  {
    prompt: "How big is the Amazon rain forest?",
    system: "Pretend to be an eloquent and poetic nature expert. The user is a child."
  },
  {
    prompt: "Suggest hobbies that I could pick up in my free time that are not too expensive.",
    system: "You are a friendly, helpful assistant. The user doesn't have much time."
  }
];

const N_SHOT_EXAMPLE = {
  prompt: "Back to the drawing board.",
  system: "",
  initial: [
    { role: "system", content: "Predict up to 5 emojis as a response to a comment. Output emojis, comma-separated." },
    { role: "user", content: "This is amazing!" },
    { role: "assistant", content: "❤️, ➕" },
    { role: "user", content: "LGTM" },
    { role: "assistant", content: "👍, 🚢" }
  ]
}

const randomPromptIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
promptEl.value = EXAMPLE_PROMPTS[randomPromptIndex].prompt;
systemPromptEl.value = EXAMPLE_PROMPTS[randomPromptIndex].system;

nShotExampleEl.addEventListener("click", () => {
  promptEl.value = N_SHOT_EXAMPLE.prompt;
  systemPromptEl.value = N_SHOT_EXAMPLE.system;
  initialPromptsEl.value = JSON.stringify(N_SHOT_EXAMPLE.initial, null, 2);
});

function linkRangewithNumber(rangeEl, numberEl) {
  rangeEl.addEventListener("input", () => {
    numberEl.value = rangeEl.value;
  });
  numberEl.addEventListener("input", () => {
    rangeEl.value = numberEl.value;
  });
}
linkRangewithNumber(temperatureEl, temperatureEl.nextElementSibling);
linkRangewithNumber(topKEl, topKEl.nextElementSibling);

addEventListener("load", async () => {
  await checkLanguageModelAPIAvailability();

  // Getting a session to show the download progress.
  let session = await getLanguageModelSession();
  let abortController;

  stopBtn.addEventListener("click", () => {
    if (abortController) {
      abortController.abort("User stopped the conversation");
    }
    abortController = null;
    session.destroy();
    spinnerEl.remove();
  });

  runBtn.addEventListener("click", async () => {
    if (promptEl.value === "") {
      return;
    }

    outputEl.textContent = "Generating response...";
    outputEl.appendChild(spinnerEl);

    // Destroy the previous session, if any.
    session?.destroy();

    const temperature = parseFloat(temperatureEl.value);
    const topK = parseInt(topKEl.value);
    const systemPrompt = systemPromptEl.value ? systemPromptEl.value.trim() : undefined;
    let initialPrompts = initialPromptsEl.value ? JSON.parse(initialPromptsEl.value) : undefined;
    
    // If both systemPrompt and initialPrompts are present, use systemPrompt only.
    // Both go into the session's initialPrompt option, so only one can be used.
    if (systemPrompt) {
      console.warn("Both systemPrompt and initialPrompts are set. Using systemPrompt only.");
      initialPrompts = [
        { role: 'system', content: systemPrompt }
      ];
    }

    console.log("Prompting with the following settings", { temperature, topK, initialPrompts });

    const metrics = new PlaygroundMetrics();
    metrics.signalOnBeforeCreateSession();

    // Create a new session.
    try {
      session = await getLanguageModelSession({
        temperature,
        topK,
        initialPrompts
      });
    } catch (e) {
      displaySessionMessage(`Could not create the LanguageModel session: ${e}`, true);
      console.error(e);
      spinnerEl.remove();
      return;
    }

    metrics.signalOnAfterSessionCreated();

    try {
      abortController = new AbortController();
      const stream = session.promptStreaming(promptEl.value, {
        signal: abortController.signal
      });

      metrics.signalOnBeforeStream();

      let isFirstChunk = true;
      for await (const chunk of stream) {
        if (isFirstChunk) {
          spinnerEl.remove();
          isFirstChunk = false;
          outputEl.textContent = "";
        }

        metrics.signalOnStreamChunk();

        outputEl.textContent += chunk;
      }
    } catch (e) {
      displaySessionMessage(`Could not generate a response: ${e}`, true);
      console.error(e);
      spinnerEl.remove();
    }
  });
});