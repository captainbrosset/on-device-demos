const ERR_PROMPT_API_NOT_DETECTED = "The Prompt API is not available. Please check the <a href='./'>requirements</a> and try again.";
const ERR_SUMMARIZER_API_NOT_DETECTED = "The Summarizer API is not available. Please check the <a href='./'>requirements</a> and try again.";
const ERR_PROMPT_MODEL_NOT_AVAILABLE = "The Prompt API is available, but the model is not. Please check the <a href='./'>requirements</a> and try again.";
const ERR_SUMMARIZER_MODEL_NOT_AVAILABLE = "The Summarizer API is available, but the model is not. Please check the <a href='./'>requirements</a> and try again.";
const ERR_API_CAPABILITY_ERROR = "Cannot create the model session now. API availability error: ";
const ERR_FAILED_CREATING_MODEL = "Could not create the language model session. Error: ";

let demoPageHasItsOwnMessage = false;
function createSessionMessageUI() {
  // In case the demo page already has its own message element.
  const demoPageEl = document.querySelector("#message-ui");
  if (demoPageEl) {
    demoPageHasItsOwnMessage = true;
    return demoPageEl;
  }

  // Otherwise, create a new one, and style it.
  const message = document.createElement("div");
  message.style =
    "font-family:system-ui;font-size:1rem;color:black;position:fixed;top:.25rem;right:.25rem;background:#eee;padding:.5rem;border-radius:.25rem;max-width:20rem;box-shadow:0 0 .5rem 0 #0005;";
  document.body.appendChild(message);
  return message;
}

let sessionMessageEl = null;
function displaySessionMessage(str, isError = false) {
  if (!sessionMessageEl) {
    sessionMessageEl = createSessionMessageUI();
  }
  sessionMessageEl.innerHTML = `<span>${str}</span>`;

  if (demoPageHasItsOwnMessage) {
    sessionMessageEl.classList.toggle("error", isError);
  } else {
    sessionMessageEl.style.color = isError ? "red" : "black";
  }
}

const modelDownloadProgressMonitor = m => {
  m.addEventListener("downloadprogress", e => {
    const current = (e.loaded / e.total) * 100;
    displaySessionMessage(`Model downloading (${current.toFixed(1)}%). Please wait.`);
    if (e.loaded == e.total) {
      displaySessionMessage("Model downloaded. Reload the page and try again.");
    }
  });
};

const defaultPromptSessionOptions = {
  temperature: 1.0,
  topK: 1,
  monitor: modelDownloadProgressMonitor
};

const defaultSummarizerSessionOptions = {
  monitor: modelDownloadProgressMonitor
};

async function getPromptSession (options) {
  if (!window.ai || !window.ai.languageModel) {
    displaySessionMessage(ERR_PROMPT_API_NOT_DETECTED, true);
    throw "API not available";
  }

  const availability = await window.ai.languageModel.availability();

  if (availability === "unavailable") {
    displaySessionMessage(ERR_PROMPT_MODEL_NOT_AVAILABLE, true);
    throw "Model not available";
  }

  if (availability !== "downloadable" && availability !== "downloading" && availability !== "available") {
    displaySessionMessage(ERR_API_CAPABILITY_ERROR + availability, true);
    throw "Can't create model session: " + availability;
  }

  let session = null;

  try {
    session = await window.ai.languageModel.create(Object.assign({}, defaultPromptSessionOptions, options));
  } catch (e) {
    displaySessionMessage(ERR_FAILED_CREATING_MODEL + e, true);
    throw "Can't create model session: " + e;
  }

  displaySessionMessage("API and model ready");
  return session;
}

async function getSummarizerSession (options) {
  if (!window.ai || !window.ai.summarizer) {
    displaySessionMessage(ERR_SUMMARIZER_API_NOT_DETECTED, true);
    throw "API not available";
  }

  const availability = await window.ai.summarizer.availability();

  if (availability == "unavailable") {
    displaySessionMessage(ERR_SUMMARIZER_MODEL_NOT_AVAILABLE, true);
    throw "Model not available";
  }

  if (availability !== "downloadable" && availability !== "downloading" && availability !== "available") {
    displaySessionMessage(ERR_API_CAPABILITY_ERROR + availability, true);
    throw "Can't create model session: " + availability;
  }

  let session = null;

  try {
    session = await window.ai.summarizer.create(Object.assign({}, defaultSummarizerSessionOptions, options));
  } catch (e) {
    displaySessionMessage(ERR_FAILED_CREATING_MODEL + e, true);
    throw "Can't create model session: " + e;
  }

  displaySessionMessage("API and model ready");
  return session;
}
