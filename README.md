# Prompt API demos

The webpages in this directory demonstrate how to use the Prompt and Summarizer APIs in Microsoft Edge to run an on-device AI language model in the browser.

## Demos

* **Developer playgrounds**

  * [Prompt API playground](prompt-api-playground.html) - A playground for the Prompt API that lets you run the model with different parameters and see the results.
  * [Summarizer API playground](summarizer-api-playground.html) - A playground for the Summarizer API that lets you run the model with different parameters and see the results.

* **Prompt API demos**

  * [Chat](chat.html) - A chat interface that lets you have a conversation with the language model.
  * [Correct typos](correct-typos.html) - Correct typos in a text document.
  * [Code of conduct](check-conduct.html) - Check if a user submitted comment violates a code of conduct.
  * [Generate blog post title](generate-title.html) - Generate a title for a blog post based on the post's content.
  * [Tag a new issue](issue-tagging.html) - Tag a new issue as a bug or a feature request based on the issue's description.

* **Summarizer API demos**

  * [Email thread summarization](summarize-email-thread.html) - Summarize an email thread into a few sentences.
    
    ⚠️ **This demo is in progress. I'm switching it from using the Prompt API to using the Summarizer API.**

## Requirements to run the demos

To run the above demos, make sure that you meet the following requirements:

* Use Microsoft Edge Canary.

  To download Canary, go to [Become a Microsoft Edge Insider](https://www.microsoft.com/edge/download/insider) and click **Download Edge Canary**.

* Enable the required feature flags:

  1. In Microsoft Edge Canary, open a new tab and go to `edge://flags/`.

  1. Enter `edge-llm-on-device-model` in the search input.

  1. Next to **Enables on device AI model**, select **Enabled**.

  1. Next to **Enable on device AI model debug logs**, optionally select **Enabled**.
  
     This flag enables better diagnostics which can be useful when you want to share information with us when problems occur.

  1. Next to **Enable on device AI model performance parameters override**, select **Enabled BypassPerfRequirement**.

  1. Now, enter `edge-llm-prompt-api-for-phi-mini` in the search input.

  1. Next to **Prompt API for Phi mini**, select **Enabled**.

  1. Now, enter `edge-llm-summarization-api-for-phi-mini` in the search input.

  1. Next to **Summarization API for Phi mini**, select **Enabled**.

  1. Restart Microsoft Edge Canary.

* Update components:

  1. Open a new tab and go to `edge://components/`.

  1. Click **Update** next to the following two components:
    
     * **Edge LLM On Device Model**
     * **Edge LLM Runtime**
