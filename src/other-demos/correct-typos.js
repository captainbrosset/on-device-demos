const SAMPLE_TEXT = `How big is the Amazn rainforest?

Thje Amazon raiforest, also known as Amazoinia, is the largest trolpical rainforest in the world and covers and area of approxiumately 5.5 millkoion square kilmometers (2.1 million sqaure milkes).

It spans across nine countries oin Souyth America, withn the majority of the forest located in Brazil, followed by Peru, Coilombia, Venezuuela, Ecuador, Blivia, Guyana, Suriname, and French Guiana.

`;

const PROMPT = `Correct typos, spelling errors, and grammar errors in the following text. Only respond with the corrected text. Do not add any other information.\n\n`;

const textarea = document.querySelector('#editor');
const button = document.querySelector("#autocorrect");

textarea.value = SAMPLE_TEXT;
textarea.focus();

// Used to avoid re-checking everything everytime.
let correctedText = "";

let isChecking = false;

getPromptSession().then((session) => {
  button.addEventListener(
    "click",
    async () => {
      if (isChecking) {
        return;
      }

      const originalText = textarea.value;
      if (correctedText === originalText) {
        return;
      }

      let textToBeChecked = originalText;
      let indexOfCorrectedText = correctedText.trim() === "" ? -1 : originalText.indexOf(correctedText);
      if (indexOfCorrectedText !== 0) {
        // If the already corrected text isn't at the beginning, check everything again.
        indexOfCorrectedText = -1;
      } else {
        // Otherwise, check only the additional text.
        textToBeChecked = originalText.substring(correctedText.length);
      }

      isChecking = true;
      button.disabled = true;
      button.classList.add("processing");
      button.textContent = "checking ...";

      // To avoid the previous session from being continued.
      const newSession = await session.clone();
      const stream = newSession.promptStreaming(PROMPT + textToBeChecked);

      // If there was already corrected text, append the new corrections to it.
      let chunks = indexOfCorrectedText !== -1 ? correctedText : "";
      for await (const chunk of stream) {
        chunks += chunk;

        textarea.value = chunks;
      }

      isChecking = false;
      button.disabled = false;
      button.classList.remove("processing");
      button.textContent = "Autocorrect";

      correctedText = textarea.value;
    }
  );
});
