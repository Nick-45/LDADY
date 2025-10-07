import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaSearch, FaChartLine, FaStore, FaComments, FaTimes } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";

// --- Stella Knowledge Base ---
const stellaKB = {
  greetings: {
    user: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
    bot: [
      "Hi there! 👋",
      "Hello! How can I help you today?",
      "Hey! Great to see you here.",
      "Good morning! 🌞",
      "Good afternoon! How’s your day going?",
      "Good evening! Ready to explore?",
    ],
  },
  fashion_basics: {
    what_is_fashion:
      "Fashion is the style of clothing, accessories, or appearance popular at a given time.",
    fashion_vs_style:
      "Fashion changes; style is timeless — it’s your unique expression.",
  },
};

// --- Stella Response Engine ---
const getStellaResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase();
  if (stellaKB.greetings.user.some((g) => lowerMsg.includes(g))) {
    return stellaKB.greetings.bot[Math.floor(Math.random() * stellaKB.greetings.bot.length)];
  }
  if (lowerMsg.includes("fashion"))
    return stellaKB.fashion_basics.what_is_fashion;
  if (lowerMsg.includes("style"))
    return stellaKB.fashion_basics.fashion_vs_style;
  return "Hmm 🤔 I’m Stella, your fashion assistant. Ask me about trends, style, or shopping!";
};

export default function RightSidebar() {
  const { data: trendingVrooms, isLoading: vroomsLoading } = useQuery({
    queryKey: ["/api/vrooms/trending"],
    queryFn: async () => {
      const res = await fetch("/api/vrooms/trending");
      return res.json();
    },
    retry: false,
  });

  const { data: trendingHashtags, isLoading: hashtagsLoading } = useQuery({
    queryKey: ["/api/hashtags/trending"],
    queryFn: async () => {
      const res = await fetch("/api/hashtags/trending");
      return res.json();
    },
    retry: false,
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMsg = { sender: "bot", text: getStellaResponse(userMsg.text) };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed right-0 top-0 h-screen w-80 bg-white p-4 flex-col border-l shadow-sm z-40">
        <SidebarContent
          trendingHashtags={trendingHashtags}
          hashtagsLoading={hashtagsLoading}
          trendingVrooms={trendingVrooms}
          vroomsLoading={vroomsLoading}
        />

        {/* Floating Stella Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition"
        >
          <FaComments size={20} />
        </button>

        {/* Chat Window */}
        {isChatOpen && (
          <ChatWindow
            messages={messages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isTyping={isTyping}
            chatEndRef={chatEndRef}
            setIsChatOpen={setIsChatOpen}
          />
        )}
      </div>

      {/* Mobile Floating Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition z-50"
      >
        {isMobileSidebarOpen ? <FaTimes size={20} /> : <FaComments size={20} />}
      </button>

      {/* Mobile Slide-In Sidebar */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-screen w-4/5 sm:w-2/3 bg-white border-l shadow-lg transform transition-transform duration-300 z-40 ${
          isMobileSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <SidebarContent
            trendingHashtags={trendingHashtags}
            hashtagsLoading={hashtagsLoading}
            trendingVrooms={trendingVrooms}
            vroomsLoading={vroomsLoading}
          />
          <Button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="mt-auto w-full bg-primary text-white"
          >
            Chat with Stella 💬
          </Button>
        </div>

        {isChatOpen && (
          <ChatWindow
            messages={messages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isTyping={isTyping}
            chatEndRef={chatEndRef}
            setIsChatOpen={setIsChatOpen}
          />
        )}
      </div>
    </>
  );
}

/* Reusable Sidebar Content Component */
function SidebarContent({
  trendingHashtags,
  hashtagsLoading,
  trendingVrooms,
  vroomsLoading,
}: any) {
  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {/* Search */}
      <div className="bg-muted rounded-full p-3">
        <div className="flex items-center space-x-3">
          <FaSearch className="text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products and vrooms..."
            className="bg-transparent outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* Trending Hashtags */}
      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Trending Hashtags</h3>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {hashtagsLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full rounded" />
                ))}
              </div>
            ) : trendingHashtags && trendingHashtags.length > 0 ? (
              trendingHashtags.map((item: any) => (
                <Link
                  key={item.tag}
                  href={`/hashtags/${encodeURIComponent(item.tag)}`}
                >
                  <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.tag}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count} products
                      </p>
                    </div>
                    <FaChartLine className="text-accent" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="p-4 text-center text-muted-foreground">
                No trending hashtags found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Popular Vrooms */}
      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Popular Vrooms</h3>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {vroomsLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : trendingVrooms && trendingVrooms.length > 0 ? (
              trendingVrooms.slice(0, 3).map((vroom: any) => (
                <Link key={vroom.id} href={`/vrooms/${vroom.id}`}>
                  <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {vroom.coverImageUrl ? (
                        <img
                          src={vroom.coverImageUrl}
                          alt={vroom.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <FaStore className="text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{vroom.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {vroom.productsCount} products • {vroom.followersCount} followers
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="p-4 text-center text-muted-foreground">
                No popular vrooms found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Chat Window Component */
function ChatWindow({
  messages,
  input,
  setInput,
  sendMessage,
  isTyping,
  chatEndRef,
  setIsChatOpen,
}: any) {
  return (
    <div className="fixed bottom-20 right-6 w-80 h-96 bg-white border border-gray-300 shadow-lg rounded-xl flex flex-col z-50">
      <div className="bg-primary text-white p-3 rounded-t-xl font-semibold flex justify-between items-center">
        <span>Stella 💬 — Eldady Assistant</span>
        <button onClick={() => setIsChatOpen(false)}>
          <FaTimes />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.map((msg: any, i: number) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[80%] ${
              msg.sender === "user"
                ? "bg-primary text-white ml-auto"
                : "bg-gray-100 text-gray-800 mr-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="bg-gray-100 text-gray-600 p-2 rounded-lg mr-auto inline-block animate-pulse">
            Stella is typing...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 border-t flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
