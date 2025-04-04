const promptEl = document.getElementById("prompt");
const helpBtn = document.getElementById("help");
const stepsEl = document.getElementById("steps");
const outputEl = document.getElementById("output");
const spinnerEl = createSpinner("spinner");
document.body.appendChild(spinnerEl);

async function getWeatherForecast({ city, when }) {
  // This is a mock API call. Start by simulating a delay.
  const delay = Math.floor(Math.random() * 4000);
  await new Promise(resolve => setTimeout(resolve, delay));

  // Pick a random weather trend
  const trends = ["sunny", "cloudy", "rainy", "stormy", "snowy"];
  const trend = trends[Math.floor(Math.random() * trends.length)];
  const highTemp = Math.floor(Math.random() * 30) + 15; // Random high temperature between 15 and 45
  const lowTemp = Math.floor(Math.random() * 15) + 5; // Random low temperature between 5 and 20

  return `The weather in ${city} on ${when} will be ${trend} with a high of ${highTemp} and a low of ${lowTemp}.`;
}

async function getWhatsOn({ city, when }) {
  const delay = Math.floor(Math.random() * 2000);
  await new Promise(resolve => setTimeout(resolve, delay));
  return `${when} in ${city}, there are several events happening ${when}, including a music festival and a food fair.`;
}

const TOOLS = [
  {
    "name": "getWeatherForecast",
    "description": "get weather forecast",
    "parameters": {
      "city": {
        "description": "The name of the city",
        "type": "str",
        "default": "Seattle"
      },
      "when": {
        "description": "The date for the forecast",
        "type": "str",
        "default": "Tomorrow",
        "enum": [
          "Today",
          "Tomorrow",
          "This week-end",
          "This week",
          "Next week"
        ]
      }
    },
    "implementation": getWeatherForecast
  },
  {
    "name": "getWhatsOn",
    "description": "get activities and events that are happening in a city",
    "parameters": {
      "city": {
        "description": "The name of the city",
        "type": "str",
        "default": "Seattle"
      },
      "when": {
        "description": "The date to search for activities",
        "type": "str",
        "default": "Today",
        "enum": [
          "Today",
          "Tomorrow",
          "This week-end",
          "This week",
          "Next week"
        ]
      }
    },
    "implementation": getWhatsOn
  }
];

const INITIAL_PROMPTS_FOR_TOOLS = [
  {
    role: "system", content: `You are a helpful travel assistant. Select a tool to answer questions about travel. You can use the following tools:

${JSON.stringify(TOOLS)}
` },
  { role: "user", content: "I'm going to Paris next week, what will the weather be like? I need help packing accordingly." },
  { role: "assistant", content: '[{"name":"getWeatherForecast","parameters":{"city":"Paris", "when":"Next week"}]' },
  { role: "user", content: "I'm in New York now, left work early, anything cool I can do while in town?" },
  { role: "assistant", content: '[{"name":"getWhatsOn","parameters":{"city":"New York", "when":"Today"}}]' },
  { role: "user", content: "I'll be in Rome this week-end. What should I pack, and what can I do there?" },
  { role: "assistant", content: '[{"name":"getWeatherForecast","parameters":{"city":"Rome", "when":"This week-end"}, {"name":"getWhatsOn","parameters":{"city":"Rome", "when":"This week-end"}}]' },
];

function showAsLoading() {
  document.body.classList.add("loading");
}

function showAsDone() {
  document.body.classList.remove("loading");
}

function displayAssistantStep(step, showAsLoading = false) {
  const stepEl = document.createElement("div");
  stepEl.classList.add("assistant-step");
  stepEl.classList.toggle("loading", showAsLoading);
  stepEl.textContent = step;

  stepsEl.appendChild(stepEl);

  return (newStep, loading = false) => {
    stepEl.textContent = newStep;
    stepEl.classList.toggle("loading", loading);
  };
}

async function getToolsForQuestion(prompt) {
  const updateAnalyzingStep = displayAssistantStep("Analyzing your travel plans ...", true);

  const session = await getPromptSession({ initialPrompts: INITIAL_PROMPTS_FOR_TOOLS });
  let response, updateCheckingStep;

  updateAnalyzingStep("Analyzing your travel plans");

  try {
    updateCheckingStep = displayAssistantStep("Checking if additional resources can help ...", true);
    response = await session.prompt(prompt);
    console.log("Tools response:", response);
  } catch (error) {
    console.error("Error during prompt:", error);
    return [];
  }

  session.destroy();

  try {
    const tools = JSON.parse(response);
    updateCheckingStep(`Found ${tools.length} additional resources: ${tools.map(tool => tool.name).join(", ")}`);

    console.log("Parsed tools:", tools);
    return tools;
  } catch (error) {
    console.error("Error parsing tools response:", error);
    return [];
  }
}

async function runTools(tools) {
  console.log("Running tools...");
  if (!Array.isArray(tools) || tools.length === 0) {
    console.error("No tools to run.");
    return [];
  }

  const toolsData = [];

  for (const { name, parameters } of tools) {
    const toolDefinition = TOOLS.find(tool => tool.name === name);
    if (!toolDefinition) {
      console.error(`Tool ${name} not found.`);
      continue;
    }

    const updateUsingStep = displayAssistantStep(`Calling ${name} ...`, true);
    console.log(`Calling tool: ${name} with parameters: ${JSON.stringify(parameters)}`);

    try {
      const toolData = await toolDefinition.implementation(parameters);
      toolsData.push(toolData);
      updateUsingStep(`${name} completed successfully`);
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);
    }
  }

  return toolsData;
}

async function getCompleteResponse(prompt, toolsData) {
  console.log("Generate a response...");

  let systemPrompt = `You are a helpful travel assistant.`;
  if (toolsData.length > 0) {
    systemPrompt += ` You have the following data to help you reply to the user:\n\n${toolsData.join("\n")}`;
  }

  console.log("System prompt:", systemPrompt);

  const updateResponseStep = displayAssistantStep("Generating a response ...", true);

  const session = await getPromptSession({ systemPrompt });
  const response = await session.prompt(prompt);
  session.destroy();

  updateResponseStep("Complete response generated");

  return response;
}

async function summarizeResponseToKeyPoints(completeResponse) {
  const updateSummarizingStep = displayAssistantStep("Summarizing the response to key points ...", true);

  const session = await getSummarizerSession({
    sharedContext: `This is a travel assistant response to the question: ${promptEl.value}`,
    type: "key-points",
    format: "plain-text",
    length: "medium",
  });

  const stream = session.summarizeStreaming(completeResponse);

  return { stream, session, updateSummarizingStep };
}

addEventListener("load", async () => {
  helpBtn.addEventListener("click", async () => {
    const prompt = promptEl.value;
    if (!prompt) return;

    showAsLoading();

    const tools = await getToolsForQuestion(prompt);
    const toolsData = await runTools(tools);
    const response = await getCompleteResponse(prompt, toolsData);
    const { stream, session, updateSummarizingStep } = await summarizeResponseToKeyPoints(response);

    let isFirstChunk = true;
    for await (const chunk of stream) {
      if (isFirstChunk) {
        isFirstChunk = false;
      }
      outputEl.textContent = chunk;
    }

    session.destroy();
    updateSummarizingStep("Your travel help report is ready!");

    showAsDone();
  });
});
