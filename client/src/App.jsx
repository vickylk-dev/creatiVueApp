import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";
import { FaPalette, FaCircle, FaUsers } from "react-icons/fa";
import { MdFormatSize, MdClear } from "react-icons/md";
import logo from "./assets/colorPalette.png";

const socket = io("https://creativue-server-1.onrender.com");

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ff0000");
  const [size, setSize] = useState(5);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(true);
   
  useEffect(() => {
    if (!username || showPopup) return;
  
    socket.emit("userJoined", username);
    socket.emit("getUsers");
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
  
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
  
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
  
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
  
    setCanvasSize();
    ctxRef.current = ctx;
  
    socket.on("updateUserList", (userList) => {
      setUsers(userList);
    });
  
    socket.on("userJoined", (name) => {
      setMessages((prev) => [...prev, `${name} has joined the session`]);
    });
  
    socket.on("userDisconnected", (name) => {
      setMessages((prev) => [...prev, `${name} has left the session`]);
    });
  
    socket.on("startStroke", ({ x, y }) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
    });
  
    socket.on("draw", ({ x, y, color, size }) => {
      ctx.beginPath();  
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    });
  
    socket.on("clearCanvas", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  
    const handleTabClose = () => {
      socket.emit("userDisconnected", username);
    };
  
    window.addEventListener("beforeunload", handleTabClose);
    window.addEventListener("resize", setCanvasSize);
  
    return () => {
      socket.emit("userDisconnected", username);
      socket.off("updateUserList");
      socket.off("userJoined");
      socket.off("userDisconnected");
      socket.off("startStroke");
      socket.off("draw");
      socket.off("clearCanvas");
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, [username, showPopup]);
  

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width; 
    const scaleY = canvasRef.current.height / rect.height; 
    return {
      x: (e.clientX - rect.left) * scaleX, 
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getMousePos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    socket.emit("startStroke", { x, y });
  };

  const continueDrawing = (e) => {
    if (!isDrawing) return;
    const { x, y } = getMousePos(e);
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = size;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    socket.emit("draw", { x, y, color, size });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctxRef.current.closePath();
  };

  const clearCanvas = () => {
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit("clearCanvas");
  };

  const handleNameSubmit = () => {
    if (username.trim()) {
      setShowPopup(false);
    }
  };

  return (
    <div className="drawing-container">
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
          <h3 className="app-name"><img src={logo} alt="img" width="20px" height="20px" style={{marginRight: "5px",}}/>CreatiVue </h3>
            <hr/>
            <h4>Enter Your Name</h4>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={handleNameSubmit}>Start Drawing</button>
          </div>
        </div>
      )}
      {!showPopup && (
        <>
          <div className="header">
            <h3 className="app-name"><img src={logo} alt="img" width="20px" height="20px" style={{marginRight: "10px",marginTop:"5px"}}/>CreatiVue </h3>
            <h5 className="welcome-msg">Welcome, {username}</h5>
          </div>
          <canvas
            ref={canvasRef}
            className="canvas"
            onMouseDown={startDrawing}
            onMouseMove={continueDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <div className="controls">
            <label>
              <FaPalette /> Color:
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
            <label>
              <MdFormatSize /> Size:
              <input type="range" min="2" max="20" value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} />
            </label>
            <button onClick={clearCanvas} className="clear-btn"><MdClear style={{ paddingTop: "3px" }}/> Clear</button>
          </div>
          <div className="messages">
            {messages.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
          <div className="users-list">
            <h4><FaUsers style={{ color: "blue", paddingTop: "3px", marginRight: "3px" }}/> Active Users:</h4>
            <ul>
              {users.map((user, index) => (
                <li key={index}><FaCircle style={{ color: "green", fontSize: "10px", marginRight: "6px" }} />{user}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default App;