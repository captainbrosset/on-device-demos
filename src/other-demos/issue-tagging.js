const descriptionEl = document.getElementById("description");
const form = document.getElementById("form");
const button = document.getElementById("submit-button");
const tags = document.getElementById("tags");
let isCheckingComment = false;

function showAsLoading() {
  button.textContent = "Tagging your issue ...";
  button.classList.add("processing");
  button.disabled = true;
}

function showAsNormal(category) {
  button.textContent = `Submit this ${category.toLowerCase()}`;
  button.classList.remove("processing");
  button.disabled = false;
}

getPromptSession({
  initialPrompts: [
    {
      role: "system",
      content:
        "Categorize a comment as either a Bug or a Feature Request. Output the category name only, no other information.",
    },
    {
      role: "user",
      content: `Repro steps:

1. Open devtools
2. Select a component
3. Click open in editor

Result "The path '/data:application/json;base64,asdgasdg/HeaderLogo.tsx:41' does not exist on this computer."

How often does this bug happen?
Every time.`,
    },
    { role: "assistant", content: "Bug" },
    {
      role: "user",
      content: `I wanted to use ref from props while also creating a local ref as a fallback.
I know this could be resolved with a little code, though I think this behavior should belong natively to React.
I would propose something like:

function Component(props: { ref?: Ref<HTMLDivElement> }) {
  const fallbackRef = useRef<HTMLDivElement>(null)
  return <div ref={[props.ref, fallbackRef]} />
}
      `,
    },
    { role: "assistant", content: "Feature Request" },
    {
      role: "user",
      content: `When I click the submit button, it should show a loading spinner and eventually show the result. It doesn't. The loading spinner runs forever and my computer freezes.`,
    },
    { role: "assistant", content: "Bug" }
  ],
}).then((session) => {
  form.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();

      if (descriptionEl.value.trim() === "") {
        return;
      }

      if (isCheckingComment) {
        return;
      }

      showAsLoading();
      isCheckingComment = true;
      // Avoid continuing the previous session.
      const newSession = await session.clone();
      const category = await newSession.prompt(descriptionEl.value);
      tags.innerHTML = `<li>${category}</li>`;
      showAsNormal(category);
      isCheckingComment = false;
    }
  );
});
