import { useEffect, useState, useRef } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import Input from "../../../../common/Input/Input";
import Button from "../../../../common/Button/Button";
import { sendChatMessage, getChatHistory } from "../../../../api/aiApi";
import { FaRobot, FaUser, FaTrashAlt, FaShieldAlt } from "react-icons/fa";

function AIAssistant() {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([
        {
            id: "welcome-msg",
            sender: "AI",
            response: "👋 Hello! I am Velora AI Safety Assistant, your 24/7 intelligent safety advisor. Ask me anything about emergency precautions, safe travel, self-defense tactics, or helpline contacts."
        }
    ]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        getChatHistory()
            .then((res) => {
                const history = res?.data || [];
                if (history.length > 0) {
                    setMessages(history);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleAsk = async (queryToAsk) => {
        const queryText = (typeof queryToAsk === "string" ? queryToAsk : question).trim();
        if (!queryText || loading) return;

        setLoading(true);
        const userMsg = { id: `user-${messages.length + 1}`, sender: "USER", message: queryText };
        setMessages((prev) => [...prev, userMsg]);
        setQuestion("");

        try {
            const res = await sendChatMessage(queryText);
            const aiData = res?.data || res;
            const responseText = typeof aiData === "string" ? aiData : (aiData?.response || aiData?.message);
            
            if (responseText) {
                setMessages((prev) => [
                    ...prev,
                    { id: `ai-${prev.length + 1}`, sender: "AI", response: responseText }
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `ai-err-${prev.length + 1}`,
                    sender: "AI",
                    response: "🚨 Emergency Protocol: If you are in immediate danger, please press the SOS button or call National Emergency Helpline 112 / Police 100 immediately."
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                id: "welcome-msg",
                sender: "AI",
                response: "👋 Hello! I am Velora AI Safety Assistant, your 24/7 intelligent safety advisor. Ask me anything about emergency precautions, safe travel, self-defense tactics, or helpline contacts."
            }
        ]);
    };

    const quickPrompts = [
        "🚨 What should I do in an SOS emergency?",
        "🌙 Is it safe to walk alone at night?",
        "🚕 Safety tips when taking a taxi or cab alone?",
        "🚶 What should I do if someone is following me?",
        "📞 What are the national emergency helpline numbers?",
        "🛡️ What are essential self-defense safety tactics?",
        "📋 How do I file an incident report with evidence?",
        "📱 How to manage emergency contacts?",
        "🚃 Bus & public transit safety advice?",
        "💻 Online harassment & Cyber crime helpline?",
        "🏫 Campus, college & hostel safety tips?",
        "🏢 Workplace & office harassment guidelines?",
        "🗺️ How do Safe Zones & safety scores work?",
        "🚗 What to do if vehicle breaks down at night?",
        "🔊 Personal safety gear & pepper spray guide?",
        "🏠 PG & rental apartment safety checklist"
    ];

    return (
        <UserLayout>
            <div className="ai" style={{ maxWidth: "850px", margin: "0 auto", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                        <h1 style={{ fontSize: "28px", color: "#f9fafb", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FaShieldAlt style={{ color: "#3b82f6" }} /> AI Safety Assistant
                        </h1>
                        <p style={{ color: "#9ca3af" }}>Ask anything related to your personal safety and emergency guidance.</p>
                    </div>
                    {messages.length > 1 && (
                        <button
                            onClick={clearChat}
                            style={{
                                background: "#374151",
                                color: "#ef4444",
                                border: "none",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <FaTrashAlt /> Clear Chat
                        </button>
                    )}
                </div>

                {/* Quick Prompts */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                    {quickPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAsk(prompt)}
                            disabled={loading}
                            style={{
                                background: "#1f2937",
                                color: "#60a5fa",
                                border: "1px solid #374151",
                                padding: "8px 14px",
                                borderRadius: "20px",
                                fontSize: "13px",
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                {/* Chat Stream Window */}
                <div style={{
                    background: "#111827",
                    borderRadius: "16px",
                    border: "1px solid #374151",
                    padding: "20px",
                    minHeight: "350px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    marginBottom: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                }}>
                    {messages.map((m, idx) => {
                        const isUser = m.sender === "USER";
                        const text = isUser ? (m.message || m.text) : (m.response || m.message);

                        return (
                            <div
                                key={m.id || `msg_${idx}`}
                                style={{
                                    display: "flex",
                                    justifyContent: isUser ? "flex-end" : "flex-start",
                                    alignItems: "flex-start",
                                    gap: "10px"
                                }}
                            >
                                {!isUser && (
                                    <div style={{ background: "#3b82f6", color: "#fff", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "32px", height: "32px" }}>
                                        <FaRobot size={16} />
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: "75%",
                                    background: isUser ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "#1f2937",
                                    color: "#f9fafb",
                                    padding: "14px 18px",
                                    borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                                    border: isUser ? "none" : "1px solid #374151",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                }}>
                                    {!isUser && (
                                        <span style={{ fontSize: "11px", color: "#60a5fa", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                                            🛡️ VELORA AI SAFETY ASSISTANT
                                        </span>
                                    )}
                                    <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                                        {text}
                                    </div>
                                </div>
                                {isUser && (
                                    <div style={{ background: "#4b5563", color: "#fff", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "32px", height: "32px" }}>
                                        <FaUser size={14} />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {loading && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ background: "#3b82f6", color: "#fff", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "32px", height: "32px" }}>
                                <FaRobot size={16} />
                            </div>
                            <div style={{ background: "#1f2937", color: "#9ca3af", padding: "12px 16px", borderRadius: "16px", fontSize: "14px", border: "1px solid #374151" }}>
                                ⚡ Velora AI is analyzing safety guidance...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            type="text"
                            placeholder="Ask your question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                        />
                    </div>
                    <Button
                        text={loading ? "Asking..." : "Ask AI"}
                        onClick={() => handleAsk()}
                        disabled={loading}
                    />
                </div>
            </div>
        </UserLayout>
    );
}

export default AIAssistant;

