import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import { AnimatePresence, motion } from "motion/react";
import { FaArrowUp } from "react-icons/fa6";
import { v4 as uuidv4 } from "uuid";

// import e from "express";
// import { div } from "motion/react-client";

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
  const [wide, setwide] = useState("");
  const [hide, setHide] = useState("hide");
  // const [loggedIn, setLoggedIn] = useState(true);
  const [isExist, setIsExist] = useState(true);

  // const [showMotion, setShowMotion] = useState(false);

  const [messageStates, setMessageStates] = useState({});

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

    console.log("1", messageStates);

    const timer = setTimeout(() => {
      setMessageStates((prevStates) => ({
        ...prevStates,
        [lastMessageId]: false, // 2초 뒤에 false로 변경 (이모지 → 메시지)
      }));
    }, 2000);

    console.log("2", messageStates);

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
        console.log("messages?", result);
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

  return (
    <>
      <div className="chatRoom">
        <div className="title">
          <div className="titleTop">Emoji</div>

          {/* <div className="onlineNumber"> */}
          <div className="userCount">
            <span className="onlineIcon"></span>
            {userCount}
          </div>

          <div className="onlineBox">Online</div>
          {/* </div> */}

          {/* <div className="translate">Hi!{localStorage.getItem("userName")}</div> */}
        </div>

        {/* <div className="marquee">
          {" "}
          <span>Please enter the text you would like to chat in Emoji</span>
          <span>Please enter the text you would like to chat in Emoji</span>
        </div> */}

        <div className="leftArrow">
          <div className="arrow"></div>
          {/* <div className="arrow"></div>
          <div className="arrow"></div> */}
        </div>

        <div
          className={`chatTop ${wide}`}
          onMouseEnter={() => {
            setwide("wide");
            setHide("");
          }}
          onMouseLeave={() => {
            setwide("");
            setHide("hide");
          }}
          onTouchStart={() => {
            setwide("wide");
            setHide("");
            console.log("hi");
          }}
          onTouchEnd={() => {
            setwide("");
            setHide("hide");
          }}
        >
          <div className={`infoText ${hide}`}>
            is a Project investigates beyond our emoji keyboards Today,
            communication extends beyond spoken and written language to include
            visual and symbolic tools like emojis, which play an increasingly
            central role in how we connect and express ourselves. Emojis allow
            us to send a digital hug, show support, or convey emotions in a way
            that is immediate and accessible. Their rise highlights the growing
            need for universal, visual communication in a globally
            interconnected world.
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
                    >
                      {" "}
                      <p className=" userName">{item.userName}</p>{" "}
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
                            {item.message}
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
                          style={{
                            backgroundColor: `rgba(${hexToRgb(
                              item.colorCode
                            )}, 0.8)`,
                          }}
                        >
                          {item.emoji}
                        </motion.p>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* <motion.div
                    initial={{ y: 200, scale: 0.5 }}
                    animate={{
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: 0.2, // 전체 애니메이션 시간
                        ease: "easeInOut", // 부드러운 애니메이션
                      },
                    }}
                    className="message "
                  >
                 
                  </motion.div> */}
                </div>
              ))}
            <div ref={messageEndRef} />
          </div>
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
