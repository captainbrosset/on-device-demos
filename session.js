// The various error messages.
const ERR_PROMPT_API_NOT_DETECTED = "The Prompt API is not available. Please check the <a href='./'>requirements</a> and try again.";
const ERR_SUMMARIZER_API_NOT_DETECTED = "The Summarizer API is not available. Please check the <a href='./'>requirements</a> and try again.";
const ERR_PROMPT_MODEL_NOT_AVAILABLE = "The Prompt API is available, but the model is not. Please check the <a href='./'>requirements</a> and try again.";
const ERR_SUMMARIZER_MODEL_NOT_AVAILABLE = "The Summarizer API is available, but the model is not. Please check the <a href='./'>requirements</a> and try again.";
const ERR_API_CAPABILITY_ERROR = "Cannot create the model session now. API availability error: ";
const ERR_FAILED_CREATING_MODEL = "Could not create the language model session. Error: ";

// This session util script displays error/success/progress messages to the user.
// If the demo page that uses this script already has its own message element, it's used.
// Otherwise, a new one is created and styled.
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
  message.className = "ai-session-message-ui";
  message.style =
    "font-family:system-ui;font-size:1rem;color:black;position:fixed;top:.25rem;right:.25rem;background:#eee;padding:.5rem;border-radius:.25rem;max-width:20rem;box-shadow:0 0 .5rem 0 #0005;";
  document.body.appendChild(message);
  return message;
}

// Display a message to the user.
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

// Utility function to display the model download progress to the user.
// This method is passed as the `monitor` option when creating a model session.
const modelDownloadProgressMonitor = m => {
  m.addEventListener("downloadprogress", e => {
    const current = (e.loaded / e.total) * 100;
    displaySessionMessage(`Model downloading (${current.toFixed(1)}%). Please wait.`);
    if (e.loaded == e.total) {
      displaySessionMessage("Model downloaded. Reload the page and try again.");
    }
  });
};

// Default options for the prompt and summarizer sessions.
// These options can be overridden by the demo page when creating a session.
const defaultPromptSessionOptions = {
  temperature: 1.0,
  topK: 1,
  monitor: modelDownloadProgressMonitor
};
const defaultSummarizerSessionOptions = {
  monitor: modelDownloadProgressMonitor
};

function getLanguageModelAPI() {
  if (window.LanguageModel) {
    return window.LanguageModel;
  }

  if (window.ai && window.ai.languageModel) {
    return window.ai.languageModel;
  }

  displaySessionMessage(ERR_PROMPT_API_NOT_DETECTED, true);
  throw ERR_PROMPT_API_NOT_DETECTED;
}

// Check if the Prompt API and model are available, and display a message to the user.
// You can call this function when the page loads if you want to display the status
// to the user early, so they know what to expect (e.g. if their browser supports the API).
// This function doesn't trigger the model download and does not create a session.
async function checkPromptAPIAvailability() {
  const languageModel = getLanguageModelAPI();
  const availability = await languageModel.availability();

  // The API is available, but the model is not.
  if (availability === "unavailable") {
    displaySessionMessage(ERR_PROMPT_MODEL_NOT_AVAILABLE, true);
    throw ERR_PROMPT_MODEL_NOT_AVAILABLE;
  }

  // The API and model seem to be available, but the model can't be used for some reason.
  if (availability !== "downloadable" && availability !== "downloading" && availability !== "available") {
    displaySessionMessage(ERR_API_CAPABILITY_ERROR + availability, true);
    throw ERR_API_CAPABILITY_ERROR + availability;
  }

  // Everything seems to be fine.
  displaySessionMessage(`Prompt API and model ${availability}`);

  return availability;
}

// Create a new session for the prompt API, possibly downloading the model first.
async function getPromptSession(options) {
  await checkPromptAPIAvailability();
  const languageModel = getLanguageModelAPI();

  let session = null;

  // Overriding the default options with the ones passed by the demo page.
  options = Object.assign({}, defaultPromptSessionOptions, options)

  try {
    session = await languageModel.create(options);
  } catch (e) {
    displaySessionMessage(ERR_FAILED_CREATING_MODEL + e, true);
    throw "Can't create model session: " + e;
  }

  displaySessionMessage("API and model ready");

  return session;
}

function getSummarizerAPI() {
  if (window.Summarizer) {
    return window.Summarizer;
  }

  if (window.ai && window.ai.summarizer) {
    return window.ai.summarizer;
  }

  displaySessionMessage(ERR_SUMMARIZER_API_NOT_DETECTED, true);
  throw ERR_SUMMARIZER_API_NOT_DETECTED;
}

// Check if the Summarizer API and model are available, and display a message to the user.
// You can call this function when the page loads if you want to display the status
// to the user early, so they know what to expect (e.g. if their browser supports the API).
// This function doesn't trigger the model download and does not create a session.
async function checkSummarizerAPIAvailability() {
  const summarizer = getSummarizerAPI();
  const availability = await summarizer.availability();

  // The API is available, but the model is not.
  if (availability == "unavailable") {
    displaySessionMessage(ERR_SUMMARIZER_MODEL_NOT_AVAILABLE, true);
    throw ERR_SUMMARIZER_MODEL_NOT_AVAILABLE;
  }

  // The API and model seem to be available, but the model can't be used for some reason.
  if (availability !== "downloadable" && availability !== "downloading" && availability !== "available") {
    displaySessionMessage(ERR_API_CAPABILITY_ERROR + availability, true);
    throw ERR_API_CAPABILITY_ERROR + availability;
  }

  // Everything seems to be fine.
  displaySessionMessage(`Summarizer API and model ${availability}`);

  return availability;
}

// Create a new session for the summarizer API, possibly downloading the model first.
async function getSummarizerSession(options) {
  await checkSummarizerAPIAvailability();
  const summarizer = getSummarizerAPI();

  let session = null;

  try {
    session = await summarizer.create(Object.assign({}, defaultSummarizerSessionOptions, options));
  } catch (e) {
    displaySessionMessage(ERR_FAILED_CREATING_MODEL + e, true);
    throw "Can't create model session: " + e;
  }

  displaySessionMessage("API and model ready");
  return session;
}
