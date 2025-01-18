import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from "buffer";
import axios from "axios";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const textModel = async (prompt) => {
  try {
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.log("error while generating prompts.", error)
    return null;

  }
}

const chatModel = async (msg) => {
  console.log(msg)
  // The Gemini 1.5 models are versatile and work with multi-turn conversations (like chat)
  try {
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
      ],
      generationConfig: {
        maxOutputTokens: 100,
      },
    });
    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = response.text();
    // console.log(text);
    return { text }
  } catch (error) {
    console.log("server error while chatting with gemini.", error)
    return null
  }
}



const ImageModel = async (prompt, imageURL) => {
  try {
    const imageBuffer = await axios({
      url: imageURL,
      method: 'GET',
      responseType: 'arraybuffer'  // Important to get the image data as a buffer
    });
    const imageParts = Buffer.from(imageBuffer.data, 'binary').toString('base64');
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, imageParts]);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    return null;
  }
}


export { textModel, ImageModel, chatModel }
