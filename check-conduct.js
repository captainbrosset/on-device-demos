const descriptionEl = document.getElementById("description");
const form = document.getElementById("form");
const button = document.getElementById("submit-button");
const message = document.getElementById("banner");
const successDialog = document.getElementById("success");
const showCOCButton = document.getElementById("show-coc");
const cocDialog = document.getElementById("coc");
const closeCOCButton = cocDialog.querySelector("button");
const COC = cocDialog.textContent;

let isCheckingComment = false;

function showAsLoading() {
  displayMessage();
  button.textContent = "Checking your message ...";
  button.classList.add("processing");
  button.disabled = true;
}

function showAsNormal() {
  button.textContent = "Send message";
  button.classList.remove("processing");
  button.disabled = false;
}

function displayMessage(str) {
  if (!str) {
    message.innerText = "";
    return;
  }
  message.innerText = str;
}

showCOCButton.addEventListener("click", () => {
  cocDialog.showModal();
});

closeCOCButton.addEventListener("click", () => {
  cocDialog.close();
});

getPromptSession({
  initialPrompts: [
    {
      role: "system",
      content:
        `Classify the following comments based on this Code of Conduct: ${COC}`,
    },
    { role: "user", content: "Thank you for this project, very useful to me!" },
    { role: "assistant", content: "acceptable" },
    {
      role: "user",
      content:
        "I found a bug in the code, when I try to run the code in Edge, it doesn't work",
    },
    { role: "assistant", content: "acceptable" },
    {
      role: "user",
      content: "What is this pile of garbage code? It doesn't work at all!",
    },
    {
      role: "assistant",
      content: "not acceptable: The comment is disrespectful and derogatory.",
    },
  ],
}).then((session) => {
  form.onsubmit = async (e) => {
    if (isCheckingComment) {
      return;
    }

    isCheckingComment = true;
    e.preventDefault();
    showAsLoading();

    // Clone to avoid the previous session from being continued.
    const newSession = await session.clone();
    const stream = newSession.promptStreaming(descriptionEl.value);

    let result = "";
    for await (const chunk of stream) {
      result += chunk;

      if (result.startsWith("acceptable")) {
        displayMessage();
        successDialog.showModal();
        break;
      }

      if (result.startsWith("not acceptable:")) {
        displayMessage("Your comment does not meet the code of conduct. Please modify it and try again.\n" + result.replace("not acceptable:", "").trim());
      }
    }

    showAsNormal();
    isCheckingComment = false;
  };
});
