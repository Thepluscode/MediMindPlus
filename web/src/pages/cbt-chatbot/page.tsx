
import { useState, useRef, useEffect } from 'react';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const suggestedTopics = [
  { icon: 'ri-heart-line', label: 'Anxiety Management', color: 'from-purple-500 to-pink-500' },
  { icon: 'ri-mental-health-line', label: 'Stress Relief', color: 'from-blue-500 to-cyan-500' },
  { icon: 'ri-emotion-line', label: 'Mood Tracking', color: 'from-green-500 to-emerald-500' },
  { icon: 'ri-brain-line', label: 'Cognitive Patterns', color: 'from-orange-500 to-amber-500' },
];

const botResponses = [
  "I understand you're feeling this way. Let's explore this together using CBT techniques.",
  "That's a common thought pattern. Let's examine the evidence for and against this belief.",
  "How would you rate the intensity of this feeling on a scale of 1-10?",
  "What physical sensations do you notice when you have these thoughts?",
  "Let's try a thought record. What was the situation that triggered this feeling?",
];

export default function CBTChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your CBT therapy assistant. I'm here to help you work through challenging thoughts and feelings using evidence-based cognitive behavioral therapy techniques. How are you feeling today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleTopicClick = (topic: string) => {
    setInputText(`I'd like to talk about ${topic}`);
  };

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                $80M Feature
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              CBT Therapy Chatbot
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl">
              Evidence-based Cognitive Behavioral Therapy support available 24/7
            </p>
          </div>

          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Suggested Topics */}
              <div className="card-gradient-border p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Suggested Topics</h2>
                <div className="space-y-3">
                  {suggestedTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleTopicClick(topic.label)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${topic.color} flex items-center justify-center flex-shrink-0`}>
                        <i className={`${topic.icon} text-white text-lg`}></i>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{topic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-start gap-3">
                  <i className="ri-information-line text-purple-600 text-xl mt-1"></i>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Important Notice</h3>
                    <p className="text-sm text-slate-700">
                      This chatbot provides CBT-based support but is not a replacement for professional mental health care. 
                      If you're in crisis, please call 988 or contact emergency services.
                    </p>
                  </div>
                </div>
              </div>

              {/* HIPAA Badge */}
              <div className="card-gradient-border p-6 text-center">
                <i className="ri-shield-check-line text-4xl text-green-500 mb-2"></i>
                <p className="text-sm font-semibold text-slate-900">HIPAA Compliant</p>
                <p className="text-xs text-slate-600 mt-1">Your conversations are secure and private</p>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-2xl shadow-lg flex flex-col" style={{ height: '700px' }}>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <i className="ri-robot-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">CBT Assistant</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-600">Online</span>
                    </div>
                  </div>
                </div>
                <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                  <i className="ri-more-2-line text-slate-600 text-xl"></i>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-[15px]">{message.text}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 px-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-slate-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-send-plane-fill text-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
