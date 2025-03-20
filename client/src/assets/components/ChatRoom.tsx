import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import { AnimatePresence, motion } from "motion/react";
import { FaArrowUp, FaPlus } from "react-icons/fa6";
import { v4 as uuidv4 } from "uuid";
import TreatsButton from "./TreatsButton";

export type NotOKType = {
  error: string;
};

type LoginOkResponse = {
  newUser: User;
};

type MessageOkResponse = {
  newChat: Message;
  user: User;
};

type Message = {
  message: any;
  emoji: string;
  userName: any;
  colorCode: string;
  _id: string;
  updatedAt: string;
  time: string;
};

type User = {
  userName: any;
  messages: Message[];
  _id: string;
};

// type errorMessage = {
//   error: string;
// };

function Intro() {
  // let navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null); // 소켓 객체를 useRef로 관리
  const [userCount, setUserCount] = useState<number>(0);
  const [modalSwitch, setModalSwitch] = useState(false);
  const [valueInput, setValueInput] = useState<any>("Max.8 words");
  const [colorValue, setColorValue] = useState("#afff59");
  const [messageValue, setMessageValue] = useState<any>("");
  const [, setNewMessage] = useState<MessageOkResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hide] = useState("hide");
  const [buttonSwitch, setButtonSwitch] = useState(false);
  // const [loggedIn, setLoggedIn] = useState(true);
  const [isExist, setIsExist] = useState(true);
  const [switchLeft, setSwitchLeft] = useState(false);
  const [messageStates, setMessageStates] = useState({});

  const getLocalTime = () => {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    const localTime = `${hours}:${minutes}`;

    return localTime;
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const newMessage = messages[messages.length - 1];
    const messageId = newMessage._id;

    setMessageStates((prevStates) => ({
      ...prevStates,
      [messageId]: true,
    }));

    const timer = setTimeout(() => {
      setMessageStates((prevStates) => ({
        ...prevStates,
        [messageId]: false,
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessageId = messages[messages.length - 1]._id; // 최신 메시지의 ID 가져오기

    setMessageStates((prevStates) => ({
      ...prevStates,
      [lastMessageId]: true, // 새 메시지는 showMotion = true
    }));

    const timer = setTimeout(() => {
      setMessageStates((prevStates) => ({
        ...prevStates,
        [lastMessageId]: false, // 2초 뒤에 false로 변경 (이모지 → 메시지)
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, [messages]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowMotion(true);
  //   }, 2000); // 1초 후에 표시
  //   setShowMotion(false);
  //   return () => clearTimeout(timer); // 클린업
  // }, [newMessage]);

  const modalVariants = {
    hidden: { y: -200, rotate: 0, opacity: 0 }, // 초기 위치: 화면 위, 투명
    visible: {
      y: 0,
      rotate: 720, // 두 번 회전 (360 * 2)
      opacity: 1,
      transition: {
        duration: 1.5, // 전체 애니메이션 시간
        ease: "easeInOut", // 부드러운 애니메이션
      },
    },
    exit: {
      y: 200,
      rotate: 1440,
      opacity: 0,
      transition: {
        duration: 1.5, // 전체 애니메이션 시간
        ease: "easeInOut", // 부드러운 애니메이션
      },
    }, // 사라질 때 아래로 이동
  };

  useEffect(() => {
    getAllmesssages();
  }, []);

  const getAllmesssages = async () => {
    try {
      const response = await fetch(
        import.meta.env.VITE_WEBSOCKET + "/api/chat/getAllChats"
      );

      if (response.ok) {
        const result = await response.json();
        // console.log("messages?", result);
        setMessages((prevMessages) => {
          return [...prevMessages, ...result.messages];
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   const checkUser = localStorage.getItem("userId");
  //   if (checkUser) {
  //     // localStorage.removeItem
  //     localStorage.removeItem("userId");
  //     localStorage.removeItem("userName");
  //     localStorage.removeItem("colorCode");
  //   }

  //   setModalSwitch(true);
  // }, []);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_WEBSOCKET, { secure: true });
    }

    const socket = socketRef.current;

    const roomName = "globalRoom"; // 방 이름 지정
    socket.emit("joinRoom", roomName);

    // 사용자 수 업데이트 받기
    socket.on("userCount", (count: number) => {
      setUserCount(count);
    });

    socketRef.current.on("showNewMessage", (data) => {
      console.log("뭐라는거야", data);

      const newMessage = { ...data, _id: data._id || uuidv4() };

      setMessages((prevMessages) => {
        return [...prevMessages, newMessage];
      });
    });

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      socket.off("userCount");
      socket.disconnect(); // 소켓 연결 해제
      socketRef.current = null; // 소켓 참조 해제
    };
  }, []);

  const clickModalInput = () => {
    setValueInput("");
  };

  const handleInputValue = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInput(e.target.value);
  };

  const createNewUser = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("userName", valueInput);
    urlencoded.append("colorCode", colorValue);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
    };

    try {
      const response = await fetch(
        import.meta.env.VITE_WEBSOCKET + "/api/user/newUser",
        requestOptions
      );

      // 응답 상태 확인
      if (!response.ok) {
        const result = (await response.json()) as NotOKType;
        console.log("something went wrong", result);
        setErrorMessage(result.error);
        setIsExist(false);
      }

      if (response.ok) {
        const result = (await response.json()) as LoginOkResponse;
        setValueInput("");
        console.log(result);
        setModalSwitch(!modalSwitch);

        localStorage.setItem("userName", valueInput);
        localStorage.setItem("userId", result.newUser._id);
        localStorage.setItem("colorCode", colorValue);
      }
    } catch (error) {
      // console.error("Error:", error.message);
      console.log(error);
      const { message } = error as Error;
      console.log(message);
    }
  };

  const handleChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageValue(e.target.value);
  };

  const sendMessage = async () => {
    setButtonSwitch(!buttonSwitch);
    console.log("time", getLocalTime());
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("userPrompt", messageValue);

    const userName = localStorage.getItem("userName");
    const userId = localStorage.getItem("userId");
    const colorCode = localStorage.getItem("colorCode");
    console.log("userId>>", userName);

    if (userName && userId && colorCode) {
      urlencoded.append("userName", userName);
      urlencoded.append("userId", userId);
      urlencoded.append("colorCode", colorCode);
      urlencoded.append("time", getLocalTime());
    }

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
    };

    try {
      const response = await fetch(
        import.meta.env.VITE_WEBSOCKET + "/api/chat/newChat",
        requestOptions
      );

      if (!response.ok) {
        const result = (await response.json()) as NotOKType;
        console.log("something went wrong", result);
        setErrorMessage(result.error);
      }

      if (response.ok) {
        const result = (await response.json()) as MessageOkResponse;
        setNewMessage(result);
        setMessageValue("");
        setButtonSwitch(!buttonSwitch);
        console.log(result);
        const roomName = "globalRoom"; // 현재 방 이름

        if (socketRef.current) {
          console.log("쏘켓실행됨");
          const newMessageToSocket = {
            userName: result.newChat.userName,
            message: result.newChat.message,
            emoji: result.newChat.emoji,
            colorCode: result.newChat.colorCode,
            _id: result.newChat._id,
            time: result.newChat.time,
            roomName,
          };

          setMessageValue("");

          socketRef.current.emit("sendNewMessage", newMessageToSocket);

          return () => {
            if (socketRef.current) {
              socketRef.current.disconnect();
            }
          };
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const hexToRgb = (hex: string) => {
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const showModal = () => {
    const existsUser = localStorage.getItem("userName"); //자료꺼내는법
    console.log(existsUser);
    if (!existsUser) {
      setModalSwitch(!modalSwitch);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColorValue(e.target.value);
    console.log("colorvalue", colorValue);
  };

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // messages가 변경될 때마다 자동으로 스크롤

  // const scrollToBottom = () => {
  //   messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // };

  useEffect(() => {
    const updateAppHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };

    updateAppHeight(); // 초기 실행
    window.addEventListener("resize", updateAppHeight); // 화면 크기 변경 시 업데이트

    return () => window.removeEventListener("resize", updateAppHeight); // 클린업
  }, []);

  return (
    <>
      <div className="desktop">Please join with a phone</div>
      <div className="chatRoom" style={{ height: "var(--app-height)" }}>
        <TreatsButton />
        <div className="top">
          <div className="title">
            <div className="titleTop">Emoji Chat</div>
            <div className="userCount">
              <span className="onlineIcon"></span>
              {userCount}
            </div>
            Online
            <div className="leftArrow">
              <motion.div
                className="arrow"
                onClick={() => {
                  setSwitchLeft(!switchLeft);
                }}
                style={{
                  cursor: "pointer",
                  transformOrigin: "center",
                  display: "flex",
                  alignItems: "center",
                }}
                animate={{
                  rotate: switchLeft ? 225 : 0, // 클릭 시 45도 회전
                  transition: { duration: 0.3 }, // 애니메이션 시간
                }}
              >
                <FaPlus />
              </motion.div>
            </div>
          </div>
        </div>

        <div className={`textModalContainer ${switchLeft ? hide : ""}`}>
          <div className="textModal">
            <p>
              (EN) Emoji Chat is a chat platform that uses emojis as its primary
              language. Users send messages in their own language, and these
              messages are translated into emojis while considering the cultural
              context of the language. In this process, the project experiments
              with the limitations of emoji's cultural inclusivity and explores
              how emojis are understood and interpreted by different users. As
              emojis continue to evolve and spread across different generations
              and cultures, their meanings and applications are constantly
              shifting. Through this exploration, the project questions the
              boundaries of emoji as a universal language and how cultural
              context influences the interpretation and evolution of these
              symbols.
            </p>
            <p>
              (DE) Emoji Chat ist eine Chat-Plattform, die Emojis als
              Hauptsprache verwendet. Benutzer senden Nachrichten in ihrer
              eigenen Sprache, die dann unter Berücksichtigung des kulturellen
              Kontextes der Sprache in Emojis übersetzt werden. In diesem
              Prozess experimentiert das Projekt mit den Grenzen der kulturellen
              Inklusivität von Emojis und untersucht, wie Emojis von
              verschiedenen Nutzern verstanden und interpretiert werden. Da
              Emojis weiterhin über verschiedene Generationen und Kulturen
              hinweg verbreitet werden, verändern sich ihre Bedeutungen und
              Anwendungen ständig. Durch diese Erkundung hinterfragt das Projekt
              die Grenzen von Emojis als universelle Sprache und wie der
              kulturelle Kontext die Interpretation und Entwicklung dieser
              Symbole beeinflusst.
            </p>
          </div>
        </div>

        <div
          className="messageContainer"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          <div className="messageContainerInside">
            {messages &&
              messages.map((item, index) => (
                <div
                  key={index}
                  className={`messages messagesInChat ${
                    localStorage.getItem("userName") === item.userName
                      ? "mine"
                      : "yours"
                  }`}
                  style={{
                    // backgroundColor: `${item.colorCode}`,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <motion.div
                    initial={{ y: 200, scale: 0.5 }}
                    animate={{
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: 0.2, // 전체 애니메이션 시간
                        ease: "easeInOut", // 부드러운 애니메이션
                      },
                    }}
                    className="message"
                  >
                    <motion.div
                      initial={{ opacity: 1, visibility: "visible" }}
                      animate={{ opacity: 1, visibility: "visible" }}
                      transition={{
                        duration: 2,
                      }}
                      style={{
                        fontSize: "20px",
                      }}
                      className="reverse"
                    >
                      {" "}
                      <p
                        className=" userName"
                        // style={{
                        //   backgroundColor: `rgba(${hexToRgb(
                        //     item.colorCode
                        //   )}, 0.8)`,
                        // }}
                      >
                        {item.userName}
                      </p>{" "}
                      {(messageStates as any)[item._id] ? (
                        <AnimatePresence mode="wait">
                          <motion.p
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            // exit={{ opacity: 0 }}
                            transition={{
                              duration: 3,
                            }}
                            style={{
                              backgroundColor: `rgba(${hexToRgb(
                                item.colorCode
                              )}, 0.8)`,
                              color: "black",
                            }}
                          >
                            <span>{item.message}</span>
                          </motion.p>
                        </AnimatePresence>
                      ) : (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            // delay: 0.8,
                            duration: 1,
                          }}
                        >
                          <span>
                            <span
                              style={{
                                backgroundColor: `rgba(${hexToRgb(
                                  item.colorCode
                                )}, 0.8)`,
                                fontSize: "33px",
                              }}
                            >
                              {item.emoji}
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#c9c9c9",
                            }}
                          >
                            {item.time}
                          </span>
                        </motion.p>
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              ))}
            <div ref={messageEndRef} />
          </div>
          <form
            className="chatBottom"
            onSubmit={(event) => {
              event?.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              onClick={showModal}
              onChange={handleChangeMessage}
              value={messageValue}
            />
            <button className="sendBtn" type="submit">
              <FaArrowUp style={{ color: "white" }} />
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {modalSwitch && (
          <div className="modalContainer">
            <motion.div
              className="modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }} // exit 애니메이션 지속 시간 설정
            >
              <div className="textInModal">
                {isExist ? `Pick a Username and Color` : errorMessage}
              </div>
              <div className="colorPicker">
                <input
                  type="color"
                  id="head"
                  name="head"
                  // defaultValue="#afff59"
                  onChange={handleColorChange}
                  value={colorValue}
                />
              </div>

              <div className="modalBottom">
                <input
                  type="text"
                  value={valueInput}
                  onChange={handleInputValue}
                  onClick={clickModalInput}
                />
                <button className="modalBtn" onClick={createNewUser}>
                  OK
                  {/* <FaArrowRightLong style={{ color: "#f2e1e177" }} /> */}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Intro;
