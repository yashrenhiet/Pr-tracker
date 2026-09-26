package io.prtracker.aireview;

/** One chat-style call to an LLM provider. Implementations own their own request/response shapes. */
interface AiReviewClient {

  /** Returns the model's raw text reply. Throws {@link AiReviewProviderException} on any failure. */
  String chat(String systemPrompt, String userPrompt);
}
