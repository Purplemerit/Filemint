import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

/**
 * Generates a specific prompt for the Generative AI model based on the desired action.
 * @param action The action to perform: 'summarize', 'generateQuestions', or 'translate'.
 * @param text The input text to process.
 * @param targetLanguage The target language for translation (required if action is 'translate').
 * @returns An object with either a 'prompt' string or an 'error' string.
 */
function getPromptForAction(
  action: string,
  text: string,
  targetLanguage?: string
): { prompt?: string; error?: string } {
  switch (action) {
    case "summarize":
      return {
        prompt: `Summarize this text clearly and concisely, focusing on the key points:\n\n${text}`,
      };

    case "generateQuestions":
      return {
        prompt: `Generate a list of 5-10 key questions based on the following text. The questions should cover the main topics and be suitable for a quiz, discussion, or comprehension check:\n\n${text}`,
      };

    case "translate":
      if (!targetLanguage) {
        return { error: "Missing 'targetLanguage' for 'translate' action." };
      }
      return {
        prompt: `Translate the following text into ${targetLanguage}:\n\n${text}`,
      };

    default:
      return {
        error:
          "Invalid 'action' specified. Must be one of: summarize, generateQuestions, translate.",
      };
  }
}

/**
 * Maps frontend 'type' to backend 'action'.
 * @param type The 'type' from the frontend request.
 * @returns The corresponding 'action' for the backend or null if invalid.
 */
function mapFrontendTypeToAction(type: string | null): string | null {
  if (!type) return null;
  switch (type) {
    case "summarizer":
      return "summarize";
    case "translator":
      return "translate";
    case "question":
      return "generateQuestions";
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    // --- Model and API Key Setup (Common for both paths) ---
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing Gemini API key in environment variables.");
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-09-2025", // Using the specified model
    });

    const contentType = req.headers.get("content-type") || "";
    let action: string | null = null;
    let targetLanguage: string | undefined = undefined;
    let textToProcess: string | null = null;
    let prompt: string | undefined = undefined;
    let promptError: string | undefined = undefined;

    // --- Path 1: Multipart Form Data (File Upload) ---
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      // 1. Get File and Extract Text
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      textToProcess = pdfData.text?.trim();

      if (!textToProcess) {
        return NextResponse.json(
          { error: "Could not extract text from PDF" },
          { status: 400 }
        );
      }

      // 2. Get Action and Language (from frontend field names)
      const frontendType = formData.get("type") as string | null;
      targetLanguage = (formData.get("targetLang") as string | null) || undefined;

      // Map frontend 'type' to backend 'action'
      action = mapFrontendTypeToAction(frontendType);

      if (!action) {
        return NextResponse.json({ error: "Invalid 'type' field in form data. Must be 'summarizer', 'translator', or 'question'." }, { status: 400 });
      }

      // 3. Get Prompt
      const result = getPromptForAction(action, textToProcess, targetLanguage);
      prompt = result.prompt;
      promptError = result.error;

    }
    // --- Path 2: JSON Request ---
    else if (contentType.includes("application/json")) {
      let body: any = {};
      try {
        body = await req.json();
      } catch (err) {
        return NextResponse.json(
          { error: "Request body is not valid JSON." },
          { status: 400 }
        );
      }

      // 1. Get Text, Action, and Language (from frontend field names)
      textToProcess = body.text;
      const jsonFrontendType = body.type;
      targetLanguage = body.targetLang;

      if (!textToProcess) {
        return NextResponse.json(
          { error: "Missing 'text' in JSON body." },
          { status: 400 }
        );
      }
      if (!action) {
        return NextResponse.json(
          { error: "Missing 'action' in JSON body. Must be 'summarize', 'generateQuestions', or 'translate'." },
          { status: 400 }
        );
      }

      // Map frontend 'type' to backend 'action'
      action = mapFrontendTypeToAction(jsonFrontendType);

      if (!action) {
        return NextResponse.json(
          { error: "Missing or invalid 'type' in JSON body. Must be 'summarizer', 'translator', or 'question'." },
          { status: 400 }
        );
      }

      // 2. Get Prompt
      const result = getPromptForAction(action, textToProcess, targetLanguage);
      prompt = result.prompt;
      promptError = result.error;

    } else {
      return NextResponse.json({ error: "Unsupported Content-Type. Must be 'application/json' or 'multipart/form-data'." }, { status: 415 });
    }

    // --- Common Logic: Handle Prompt Generation and AI Call ---

    // Check for errors from getPromptForAction
    if (promptError) {
      return NextResponse.json({ error: promptError }, { status: 400 });
    }

    if (!prompt) {
      // This should not happen if promptError is not set, but as a safeguard:
      console.error("❌ [PDF Tools API Error]: Prompt was not generated, but no error was caught.");
      return NextResponse.json({ error: "Internal Server Error: Could not generate prompt." }, { status: 500 });
    }

    // Call the Generative AI Model
    const result = await model.generateContent(prompt);
    const output = result.response?.text?.() || `No response generated for action: ${action}.`;

    return NextResponse.json({ result: output, action: action }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [PDF Tools API Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}