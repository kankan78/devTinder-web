import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { createSocketConnection } from "../utils/socket";
import { BASE_URL } from "../utils/constants";
import axios from "axios";

const Chat = function () {
  const { targetUserId } = useParams();
  const [msgTxt, setMsgTxt] = useState("");
  const [messages, setMessages] = useState([]);
  const user = useSelector(store => store.user);
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    const fetchData = async function () {
      const res = await axios.get(BASE_URL + "/chat/get/" + targetUserId, {
        withCredentials: true,
      });
      const messages = res?.data?.chat?.messages?.map((message) => {
        return { 
          text: message.text,
          firstName: message.senderId.firstName,
          lastName: message.senderId.lastName
        }
      });

      setMessages(messages);
    }

    fetchData();
  }, [userId])

  useEffect(() => {
    if (!userId) return;
    const socket = createSocketConnection();
    // As soon as my user connect to chat , start socket connection
    socket.emit("joinChat", { userId, targetUserId });

    socket.on("messageReceived", ({ firstName, message }) => {
      setMessages((prev) => [...prev, { firstName, text: message }]);
      setMsgTxt("")
    })

    // Disconnect socket for cleanup
    return () => socket.disconnect()
  }, [userId, targetUserId]);

  const sendMessage = function () {
    const socket = createSocketConnection();
    socket.emit("sendMessage",
      {
        userId,
        targetUserId,
        message: msgTxt,
        firstName: user?.firstName
      }
    );
  }

  return (
    <div className="w-1/2 mx-auto border border-gray-600 m-5 h-[70vh] flex flex-col">
      <h1 className="border-b border-gray-600 p-5">Chat</h1>
      <div className="flex-1 overflow-scroll p-5">
        {
          messages?.map((message, idx) => {
            return (
              <div className={`chat ${message.firstName !== user.firstName ? "chat-start" : "chat-end"}`} key={idx}>
                <div className="chat-header">
                  {message.firstName}
                  {/* <time className="text-xs opacity-50">12:45</time> */}
                </div>
                <div className="chat-bubble">{message.text}</div>
                {/* <div className="chat-footer opacity-50">Delivered</div> */}
              </div>
            )
          })
        }
      </div>
      <div className="flex items-centre p-5 border-t gap-2 border-gray-600 ">
        <input className="flex-1 border border-gray-300 rounded" value={msgTxt} onChange={(e) => setMsgTxt(e.target.value)}></input>
        <button className="btn btn-primary" onClick={sendMessage}>SEND</button>
      </div>
    </div>
  )
}

export default Chat;