const sessionPromise = getPromptSession();

const sendButton = document.getElementById("send");
const stopButton = document.getElementById("stop");
const chatInput = document.getElementById("input");
const loader = document.getElementById("loader");
const cpsEl = document.getElementById("cps");
const tpsEl = document.getElementById("tps");
const latencyEl = document.getElementById("latency");
const messagesEl = document.getElementById("messages-inner");

const INITIAL_PROMPTS = [
  "Recommend me three different travel destinations for my next vacation.",
  "What are nice recipes if I want to cook something with chicken?",
  "What were the most popular movies of 2021?",
  "How big is the Amazon rain forest?",
  "Suggest hobbies that I could pick up in my free time that are not too expensive.",
];

let success = true;
let lastAiResponseEl = null;
let currentCps = 0;
let currentTps = 0;
let initialDelay = null;
let startTime = null;
let postPrefillTime = null;
let postPrefillC = null;
let postPrefillT = null;
let tokenCount = 0;

function showBusy(busy) {
  loader.style.visibility = busy ? "visible" : "hidden";
}

// Creating an AbortController to cancel the stream when the user
// either clicks Stop or sends a new message.
let abortController = null;

async function main(input) {
  showBusy(true);

  const session = await sessionPromise;

  // If an abort controller exists, that means a conversation is already happening.
  // Abort it now.
  if (abortController) {
    abortController.abort("User started a new conversation");
  }
  // And create a new abort controller.
  abortController = new AbortController();

  lastAiResponseEl.scrollIntoView(false);

  // Wait for the next frame to show the loading state.
  // This is because if we do it synchronously, there won't be a chance
  // for the aborted conversation to remove the loading state, and it would
  // remove it after these lines have run.
  await new Promise(r => setTimeout(r, 0));
  sendButton.classList.toggle("processing", true);
  document.body.classList.toggle("processing", true);

  // Send our prompt to the mode.
  let stream = null;
  try {
    stream = session.promptStreaming(input, { signal: abortController.signal });
  } catch (e) {
    console.error("Cannot create stream now", e);
  }

  try {
    for await (const chunk of stream) {
      showBusy(false);
      if (lastAiResponseEl.innerText === "...") {
        lastAiResponseEl.innerText = chunk;
      } else {
        lastAiResponseEl.innerText += chunk;
      }
      tokenCount++;

      // Wait for prefill to complete before we estimate tokens per second.
      if (tokenCount >= 2) {
        if (postPrefillTime) {
          const seconds = Math.floor((Date.now() - postPrefillTime) / 1000);
          currentCps = Math.round(
            (lastAiResponseEl.innerText.length - postPrefillC) / seconds
          );
          currentTps = Math.round((tokenCount - postPrefillT) / seconds);
        } else {
          postPrefillTime = Date.now();
          postPrefillC = lastAiResponseEl.innerText.length;
          postPrefillT = tokenCount;
        }
      }
      if (initialDelay == null) {
        initialDelay = Date.now() - startTime;
        latencyEl.innerText = initialDelay;
      }
      cpsEl.innerText = currentCps;
      tpsEl.innerText = currentTps;
    }
  } catch (e) {
    console.error("Stream error", e);
  } finally {
    console.log("finally, remove loading state")
    sendButton.classList.toggle("processing", false);
    document.body.classList.toggle("processing", false);
    showBusy(false);
  }
}

async function submitMessage() {
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const inputText = chatInput.value;
  const prompt = inputText;

  const userMessage = document.createElement("p");
  userMessage.setAttribute("class", "from-me");
  userMessage.innerText = inputText;
  messagesEl.appendChild(userMessage);

  const aiMessage = document.createElement("p");
  aiMessage.setAttribute("class", "from-them");
  messagesEl.appendChild(aiMessage);
  lastAiResponseEl = aiMessage;
  aiMessage.innerText = "...";

  startTime = Date.now();
  tokenCount = 0;
  postPrefillTime = null;
  postPrefillC = null;
  postPrefillT = null;

  chatInput.value = "";
  main(prompt);
}

chatInput.value = INITIAL_PROMPTS[Math.floor(Math.random() * INITIAL_PROMPTS.length)];

sendButton.addEventListener("click", submitMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submitMessage();
  }
});

stopButton.addEventListener("click", () => {
  if (abortController) {
    abortController.abort("User stopped the conversation");
    sendButton.classList.toggle("processing", false);
    document.body.classList.toggle("processing", false);
  }
});

showBusy(false);
