import OpenAI from "openai";
import * as dotenv from "dotenv";
import messageModel from "../models/chatModel.js";
import userModel from "../models/userModel.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const translate = async (req, res) => {
  //   console.log(req.body);
  const text = req.body.userPrompt;
  const userName = req.body.userName;
  const userId = req.body.userId;
  const colorCode = req.body.colorCode;
  const time = req.body.time;
  // const userPrompt = `Translate the phrase ${text}, just use emojis`;

  // const userPrompt = `Translate the phrase into emojis: ${text}, just use emojis`;
  // const userPrompt = `Translate the following phrase into emojis only. Consider the cultural context of the language and make sure the translation is as understandable as possible using emojis. Do not use any text, only emojis. Here is the phrase: "${text}"`;

  // const userPrompt = `Translate the following phrase into emojis only. Ensure the translation reflects the cultural and regional context of the language, incorporating elements unique to the culture where the phrase originates. Make the translation as understandable as possible while using emojis. Do not include any text. Here is the phrase: "${text}"`;
  const userPrompt = `You are an emoji translator that outputs ONLY emojis.
Translate the given phrase into emojis that best capture its meaning, emotion, and cultural nuance.
Consider how people from the culture associated with the phrase would visually or symbolically express it.
If the phrase implies a local food, gesture, or etiquette, choose emojis that represent those cultural associations.
Avoid generic outputs like 🍽️😋👌 that ignore cultural context.
Do NOT use country flags unless the country is explicitly mentioned in the phrase.
If the phrase is already represented by emojis, return them unchanged.
If input is empty, return contextually relevant emojis based on prior conversation.:  "${text} `;

  try {
    // const userPrompt = `Translate the following phrase into emojis only. Make sure the translation captures the exact meaning of the original phrase as closely as possible. At the same time, reflect the cultural and regional context of the language by incorporating culturally unique elements where appropriate. The result should only use emojis and be easy to understand. Here is the phrase: "${text}”`;
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      // model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.9,
    });

    console.log(response.choices[0].message.content);

    const emoji = response.choices[0].message.content;

    const newChatMessage = {
      userName: userName,
      userId: userId,
      message: text,
      emoji: emoji,
      colorCode: colorCode,
      time: time,
    };

    const newChat = new messageModel(newChatMessage);
    await newChat.save();

    const user = await userModel
      .findByIdAndUpdate(
        userId,
        {
          $push: { chat: newChat._id },
        },
        { new: true }
      )
      .populate("chat");

    const updatedUser = await user.save();

    // console.log(updatedUser); // 업데이트된 사용자 정보와 채팅 데이터 포함

    res.status(200).json({
      newChat: newChat,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getAllChats = async (req, res) => {
  try {
    const messages = await messageModel.find({});
    res.status(200).json({
      messages: messages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server Erorr" });
  }
};

export { translate, getAllChats };
