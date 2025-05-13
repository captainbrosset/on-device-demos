const promptEl = document.querySelector("#prompt");
const systemPromptEl = document.querySelector("#system-prompt");
const initialPromptsEl = document.querySelector("#initial-prompts");
const responseSchemaEl = document.querySelector("#response-schema");
const topKEl = document.querySelector("#top-k");
const temperatureEl = document.querySelector("#temperature");
const runBtn = document.querySelector("#run");
const stopBtn = document.querySelector("#stop");
const nShotExampleEl = document.querySelector("#n-shot-example");
const responseSchemaExampleEl = document.querySelector("#response-schema-example");
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
};

const RESPONSE_SCHEMA_EXAMPLE = {
  prompt: "Rate the following movie from 0 to 5 stars: 'The Shawshank Redemption'.",
  system: "You are a movie critic.",
  schema: {
    "type": "object",
    "required": [
      "rating",
      "review"
    ],
    "additionalProperties": false,
    "properties": {
      "rating": {
        "type": "number",
        "minimum": 0,
        "maximum": 5
      },
      "review": {
        "type": "string",
        "description": "A short review of the movie."
      }
    }
  }
};

const randomPromptIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
promptEl.value = EXAMPLE_PROMPTS[randomPromptIndex].prompt;
systemPromptEl.value = EXAMPLE_PROMPTS[randomPromptIndex].system;

nShotExampleEl.addEventListener("click", () => {
  promptEl.value = N_SHOT_EXAMPLE.prompt;
  systemPromptEl.value = N_SHOT_EXAMPLE.system;
  initialPromptsEl.value = JSON.stringify(N_SHOT_EXAMPLE.initial, null, 2);
  responseSchemaEl.value = "";
});

responseSchemaExampleEl.addEventListener("click", () => {
  promptEl.value = RESPONSE_SCHEMA_EXAMPLE.prompt;
  systemPromptEl.value = RESPONSE_SCHEMA_EXAMPLE.system;
  initialPromptsEl.value = "";
  responseSchemaEl.value = JSON.stringify(RESPONSE_SCHEMA_EXAMPLE.schema, null, 2);
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
    let initialPrompts = null;
    try {
      initialPrompts = initialPromptsEl.value ? JSON.parse(initialPromptsEl.value) : undefined;
    } catch (e) {
      displaySessionMessage(`Invalid initialPrompts JSON: ${e}`, true);
      console.error(e);
      spinnerEl.remove();
      return;
    }

    let responseConstraint = null;
    try {
      responseConstraint = responseSchemaEl.value ? JSON.parse(responseSchemaEl.value) : undefined;
    } catch (e) {
      displaySessionMessage(`Invalid responseSchema JSON: ${e}`, true);
      console.error(e);
      spinnerEl.remove();
      return;
    }

    // If both systemPrompt and initialPrompts are present, use systemPrompt only.
    // Both go into the session's initialPrompt option, so only one can be used.
    if (systemPrompt) {
      initialPrompts = [
        { role: 'system', content: systemPrompt }
      ];
    }

    console.log("Prompting with the following settings", { temperature, topK, initialPrompts, responseConstraint });

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
        signal: abortController.signal,
        responseConstraint
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