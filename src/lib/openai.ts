import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const detectLanguageAndTranslateToEnglish = async (text: string) => {
  if (!process.env.OPENAI_API_KEY) {
    return { translatedContent: null, originalLanguage: "en" };
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            'You are a professional translator and language detector. Detect the language of the prompt and translate it to English. If the language is already English, just return the text as is. Return a strict JSON response with the following format: {"language": "[ISO 639-1 language code]", "translatedContent": "[translated text]"}. Do not return any other text.',
        },
        { role: "user", content: text },
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (response) {
      const parsed = JSON.parse(response);
      return {
        translatedContent: parsed.translatedContent,
        originalLanguage: parsed.language,
      };
    }
  } catch (error) {
    console.error("OpenAI translate error:", error);
  }
  return { translatedContent: null, originalLanguage: null };
};

export const translateAgentMessageToCustomerLanguage = async (text: string, targetLanguageCode: string) => {
  if (!process.env.OPENAI_API_KEY || targetLanguageCode === "en") {
    return { translatedContent: null };
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to the language represented by the ISO code: ${targetLanguageCode}. Return ONLY the translated text. Do not wrap in quotes or add explanations.`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-4o-mini",
    });

    const translatedContent = completion.choices[0].message.content;
    return { translatedContent };
  } catch (error) {
    console.error("OpenAI translate error:", error);
  }
  return { translatedContent: null };
};
