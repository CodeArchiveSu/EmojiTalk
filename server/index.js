import * as dotenv from "dotenv";
// const express = require("express");
import express from "express";
import cors from "cors";
// const OpenAi = require("openai");
// const mongoose = require("mongoose");
import mongoose from "mongoose";
// import router from "./routes/testRoute.js";
import userRouter from "./routes/userRoute.js";
import router from "./routes/testRoute.js";
import chatRouter from "./routes/chatRoute.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import session from "express-session";
import OpenAI from "openai";
import messageModel from "./models/chatModel.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
const server = createServer(app);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://emojichat-app.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  })
);


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('process.env.FRONTEND_URL', process.env.FRONTEND_URL);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});



// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "https://emojichat-app.vercel.app",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// server.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
//   console.log(`Allowed origin: ${process.env.FRONTEND_URL}`);
// });



mongoose.connect(process.env.MONGO_DB)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));


console.log("MONGO_DB:", process.env.MONGO_DB);

// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL,
//     methods: ["GET", "POST"],
//   },
// });

let userCount = 0;

io.on("connection", (socket) => {
  console.log(`새 클라이언트 연결: ${socket.id}`);
  userCount++; // 접속자 수 증가
  console.log(`총 접속자 수: ${userCount}`);

  io.emit("userCount", userCount);

  socket.on("joinRoom", (roomName) => {
    console.log(`User joined room: ${roomName}`);
    socket.join(roomName);
  });

  socket.on("joinRoom", (roomName) => {
    console.log(`User joined room: ${roomName}`);
    socket.join(roomName);
  });

  // 메시지 브로드캐스트
  socket.on("sendNewMessage", async (data) => {
    const { roomName, message } = data;
    console.log(`Message received in room ${roomName}:`, data);

    io.to(roomName).emit("showNewMessage", data);

    if (userCount === 1) {
      const botResponse = await getBotResponse(message); // OpenAI 응답 호출
      const emojiResponse = await getEmojiResponse(botResponse);

      const botMessage = {
        userName: "AI Bot",
        message: botResponse,
        emoji: emojiResponse,
        colorCode: "#b9bab8",
        roomName: "globalRoom",
      };

      const newMessageBot = {
        userId: "67a9081404928d370c72c1aa",
        userName: "AI Bot",
        message: botResponse,
        emoji: emojiResponse,
        colorCode: "#b9bab8",
      };

      const newChat = new messageModel(newMessageBot);
      await newChat.save();

      console.log("botMessage", botMessage);

      setTimeout(() => {
        io.to(roomName).emit("showNewMessage", botMessage);
      }, 1000);
    }
  });

  socket.on("disconnect", () => {
    userCount--; // 접속자 수 감소
    console.log(`클라이언트 연결 해제: ${socket.id}`);
    console.log(`총 접속자 수: ${userCount}`);

    io.emit("userCount", userCount);
  });
});


// Express 예시
app.get('/health', (req, res) => res.status(200).send('ok'));


async function getBotResponse(userMessage) {
  console.log("running getBotResponse");

  try {
    const systemMessage = {
      role: "system",
      content:
        "너는 친근하고 자연스러운 말투로 대화하는 챗봇이야. 너무 기계적인 말투는 피하고, 인간처럼 대화해줘.",
    };

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // OpenAI 모델
      messages: [systemMessage, { role: "user", content: userMessage }],
      max_tokens: 150,
      temperature: 0.3,
    });

    return response.choices[0].message.content; // OpenAI 응답 텍스트 반환
  } catch (error) {
    console.error("Error while fetching bot response:", error);
    return "죄송합니다, 요청을 처리할 수 없습니다.";
  }
}

async function getEmojiResponse(userMessage) {
  const userPrompt = `Translate the following phrase into emojis only. Make sure the translation captures the exact meaning of the original phrase as closely as possible. At the same time, reflect the cultural and regional context of the language by incorporating culturally unique elements where appropriate. The result should only use emojis and be easy to understand. Here is the phrase: "${userMessage}”`;
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
  const emoji = response.choices[0].message.content;
  return emoji;
}

const startServer = () => {
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

const loadRoutes = () => {
  app.use("/api", router);
  app.use("/api/user", userRouter);
  app.use("/api/chat", chatRouter);
  // app.use
  // app.use("/api/user", userRouter);
  // app.use("/api/chat", chatRouter);
};

const addMiddlewares = () => {
  app.use(express.json());
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
};

// app.post("");

const DBConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log("connection established");
  } catch (error) {
    console.log(error);
  }
};

const startApp = async () => {
  await DBConnection();
  addMiddlewares();
  loadRoutes();
  startServer();
};

startApp();
