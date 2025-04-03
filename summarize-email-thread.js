const summarizeButton = document.getElementById("summarize-thread");
const threadEl = document.querySelector(".email-details-column .thread");
const summaryEl = threadEl.querySelector(".ai-summary");

function getThreadMessages() {
  const messages = [];

  threadEl.querySelectorAll(".email").forEach((emailEl) => {
    const from = emailEl.querySelector(".from").textContent;
    const message = emailEl
      .querySelector(".message")
      .textContent.replace(/\n/g, "")
      .replace(/\s+/g, " ")
      .trim();
    messages.push({ from, message });
  });

  return messages.reverse();
}

const sessionPromise = getSummarizerSession({
  sharedContext: "This is an email thread.",
  type: "key-points",
  format: "plain-text",
  length: "short"
});

let isSummarizing = false;

async function summarizeThread() {
  if (isSummarizing) {
    return;
  }

  summarizeButton.classList.toggle("processing", true);

  isSummarizing = true;
  summaryEl.textContent = "Summarizing ...";

  const messages = getThreadMessages()
    .map(({ from, message }, index) => {
      return `Message ${index + 1} from ${from}: ${message}`;
    })
    .join("\n---\n");

  console.log(messages);

  const session = await sessionPromise;
  const stream = session.summarizeStreaming(messages);

  let isFirstChunk = true;
  let lastTextNode = null;
  for await (const chunk of stream) {
    if (isFirstChunk) {
      isFirstChunk = false;
      summaryEl.textContent = "";
    }

    if (chunk.trim() === "") {
      lastTextNode = null;
      summaryEl.appendChild(document.createElement("br"));
    }

    if (lastTextNode) {
      lastTextNode.textContent += chunk;
    } else {
      lastTextNode = document.createTextNode(chunk);
      summaryEl.appendChild(lastTextNode);
    }
  }

  summarizeButton.classList.toggle("processing", false);
  isSummarizing = false;
}

summarizeButton.addEventListener("click", summarizeThread);
