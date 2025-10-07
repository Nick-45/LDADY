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
    user: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you", "what's up", "yo", "sup", "greetings"],
    bot: [
      "Hi there! 👋",
      "Hello! How can I help you today?",
      "Hey! Great to see you here.",
      "Good morning! Hope your day is going well. 🌞",
      "Good afternoon! How's your day so far?",
      "Good evening! Ready to explore some fashion?",
      "I'm doing great, thanks for asking! How about you?",
      "All good here, what about you?",
      "Yo! 😎",
      "Sup! How can I assist?",
      "Greetings! How can I make your day better?",
    ],
  },
  fashion_basics: {
    what_is_fashion:
      "Fashion is the style of clothing, accessories, footwear, or makeup that is popular at a particular time.",
    fashion_vs_style:
      "Fashion is about trends that come and go, while style is about personal expression and how you wear fashion in your own unique way.",
  },
  clothing_types: {
    formal: ["Suits", "Tuxedos", "Gowns", "Blazers", "Dress shirts"],
    casual: ["Jeans", "T-shirts", "Hoodies", "Sneakers"],
    traditional: ["Kitenge", "Kikoy", "Maasai shuka"],
    sportswear: ["Tracksuits", "Leggings", "Sports jerseys"],
    streetwear: ["Hoodies", "Graphic tees", "Caps", "Sneakers"],
  },
  accessories: {
    jewelry: ["Earrings", "Necklaces", "Rings"],
    footwear: ["Heels", "Sneakers", "Boots", "Sandals"],
    bags: ["Handbags", "Backpacks", "Clutches"],
    hats: ["Baseball caps", "Fedoras", "Berets"],
    others: ["Watches", "Belts"],
  },
  fashion_trivia: {
    fashion_seasons: ["Spring/Summer", "Fall/Winter", "Resort (Cruise)", "Pre-Fall"],
    sustainable_fashion:
      "Clothing and accessories made in eco-friendly, ethical, and socially responsible ways.",
    fun_facts: [
      "The word 'fashion' comes from the Latin factio, meaning 'making'.",
      "Paris is often considered the fashion capital of the world.",
      "Sneakers were first called 'plimsolls' in the 1800s.",
      "Sustainable fashion is one of the fastest-growing trends in 2025.",
    ],
  },
  fashion_advice: {
    interview:
      "Wear formal business attire — suit, dress shirt, tie (for men), or a modest dress/blouse and trousers/skirt (for women). Neutral colors like black, navy, or grey work best.",
    styling_jeans: [
      "Casual: Pair with a T-shirt and sneakers.",
      "Smart casual: Pair with a blazer and loafers.",
      "Trendy: Pair with crop tops, boots, or oversized jackets.",
    ],
    color_combinations: [
      "Black + White",
      "Blue + White",
      "Red + Black",
      "Beige + Brown",
      "Pastel shades together",
    ],
  },
  shopping_process: {
    process: [
      "Message seller to place an order.",
      "Or add to cart all your desired products and the seller will reach out to confirm.",
    ],
    delivery_methods: [
      "Home delivery (arranged directly with seller).",
      "Pickup at agreed location.",
    ],
    payment_methods: ["Strictly payment after delivery (cash or M-Pesa)."],
    delivery_time:
      "Delivery time will depend on one-on-one agreement and arrangements with the seller.",
  },
};

// --- Stella Response Engine ---
const getStellaResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase();

  // Greetings
  if (stellaKB.greetings.user.some((g) => lowerMsg.includes(g))) {
    return stellaKB.greetings.bot[Math.floor(Math.random() * stellaKB.greetings.bot.length)];
  }

  // Fashion basics
  if (lowerMsg.includes("what is fashion")) return stellaKB.fashion_basics.what_is_fashion;
  if (lowerMsg.includes("fashion vs style")) return stellaKB.fashion_basics.fashion_vs_style;

  // Clothing
  if (lowerMsg.includes("formal")) return "Formal wear examples: " + stellaKB.clothing_types.formal.join(", ");
  if (lowerMsg.includes("casual")) return "Casual wear examples: " + stellaKB.clothing_types.casual.join(", ");
  if (lowerMsg.includes("traditional"))
    return "Traditional wear examples: " + stellaKB.clothing_types.traditional.join(", ");
  if (lowerMsg.includes("sportswear"))
    return "Sportswear examples: " + stellaKB.clothing_types.sportswear.join(", ");
  if (lowerMsg.includes("streetwear"))
    return "Streetwear examples: " + stellaKB.clothing_types.streetwear.join(", ");

  // Accessories
  if (lowerMsg.includes("jewelry")) return "Jewelry: " + stellaKB.accessories.jewelry.join(", ");
  if (lowerMsg.includes("footwear")) return "Footwear: " + stellaKB.accessories.footwear.join(", ");
  if (lowerMsg.includes("bags")) return "Bags: " + stellaKB.accessories.bags.join(", ");
  if (lowerMsg.includes("hats")) return "Hats: " + stellaKB.accessories.hats.join(", ");
  if (lowerMsg.includes("accessories"))
    return "Accessories include: " + [
      ...stellaKB.accessories.jewelry,
      ...stellaKB.accessories.footwear,
      ...stellaKB.accessories.bags,
      ...stellaKB.accessories.hats,
      ...stellaKB.accessories.others,
    ].join(", ");

  // Trivia
  if (lowerMsg.includes("fashion seasons")) return "Fashion seasons: " + stellaKB.fashion_trivia.fashion_seasons.join(", ");
  if (lowerMsg.includes("sustainable")) return stellaKB.fashion_trivia.sustainable_fashion;
  if (lowerMsg.includes("fun fact")) return stellaKB.fashion_trivia.fun_facts[Math.floor(Math.random() * stellaKB.fashion_trivia.fun_facts.length)];

  // Advice
  if (lowerMsg.includes("interview")) return stellaKB.fashion_advice.interview;
  if (lowerMsg.includes("jeans")) return "Ways to style jeans:\n" + stellaKB.fashion_advice.styling_jeans.join("\n");
  if (lowerMsg.includes("color")) return "Nice color combos: " + stellaKB.fashion_advice.color_combinations.join(", ");

  // Shopping
  if (lowerMsg.includes("order")) return "Order process:\n" + stellaKB.shopping_process.process.join("\n");
  if (lowerMsg.includes("delivery")) return "Delivery options:\n" + stellaKB.shopping_process.delivery_methods.join("\n");
  if (lowerMsg.includes("payment")) return "Payment methods:\n" + stellaKB.shopping_process.payment_methods.join("\n");
  if (lowerMsg.includes("time")) return stellaKB.shopping_process.delivery_time;

  return "Hmm 🤔 I'm Stella, Eldady's fashion assistant. That's a bit tricky! You can also reach us at 📧 support@eldady.com or 📱 WhatsApp +254-700-123456.";
};

interface RightSidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function RightSidebar({ isMobile = false, isOpen = false, onClose }: RightSidebarProps) {
  // --- Fetch Trending Data ---
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

  // --- States ---
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMessage = { sender: "bot", text: getStellaResponse(userMessage.text) };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200);
  };

  // Helper: Format counts
  const formatCount = (count: number): string => {
    if (!count) return "0";
    if (count < 1000) return count.toString();
    return (count / 1000).toFixed(1) + "K";
  };

  const handleFollowToggle = async (vroomId: string) => {
    const isCurrentlyFollowing = followingStates[vroomId] || false;
    setFollowingStates((prev) => ({ ...prev, [vroomId]: !isCurrentlyFollowing }));

    try {
      const res = await fetch(`/api/vrooms/${vroomId}/follow`, {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
    } catch (err) {
      console.error(err);
      setFollowingStates((prev) => ({ ...prev, [vroomId]: isCurrentlyFollowing }));
    }
  };

  // Main sidebar content
  const sidebarContent = (
    <div className={`
      bg-white flex flex-col
      ${isMobile 
        ? "w-full h-full p-4" 
        : "fixed right-0 top-0 h-screen w-80 p-4"
      }
    `}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-bold">Explore</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <FaTimes size={16} />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="bg-muted rounded-full p-3 mb-6">
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
        <Card className="mb-6">
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
                    onClick={isMobile ? onClose : undefined}
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
        <Card className="mb-6">
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
                trendingVrooms.slice(0, 3).map((vroom: any) => {
                  const isFollowing = followingStates[vroom.id] || false;
                  return (
                    <Link 
                      key={vroom.id} 
                      href={`/vrooms/${vroom.id}`}
                      onClick={isMobile ? onClose : undefined}
                    >
                      <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {vroom.coverImageUrl ? (
                            <img
                              src={vroom.coverImageUrl}
                              alt={vroom.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <FaStore className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{vroom.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {formatCount(vroom.productsCount || 0)} products •{" "}
                              {formatCount(vroom.followersCount || 0)} followers
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isFollowing ? "outline" : "default"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFollowToggle(vroom.id);
                          }}
                          className="flex-shrink-0 ml-2"
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  No popular vrooms found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer - Only show on desktop */}
      {!isMobile && (
        <div className="py-4 border-t border-border mt-auto text-center text-xs text-muted-foreground">
          <div className="mb-2">
            © {new Date().getFullYear()} Eldady. All Rights Reserved.
          </div>
          <div className="flex justify-center space-x-4">
            <Link href="/terms-of-service">
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Terms of Service
              </span>
            </Link>
            <Link href="/privacy-policy">
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Privacy Policy
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  // Stella Chat Components (same for both mobile and desktop)
  const stellaChat = (
    <>
      {/* Floating Stella Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`
          bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition z-40
          ${isMobile ? "fixed bottom-6 right-6" : "fixed bottom-6 right-6"}
        `}
      >
        <FaComments size={20} />
      </button>

      {/* Stella Chat Window */}
      {isChatOpen && (
        <div className={`
          fixed bg-white border border-gray-300 shadow-lg rounded-xl flex flex-col z-50
          ${isMobile 
            ? "bottom-20 right-4 left-4 h-96" 
            : "bottom-20 right-6 w-80 h-96"
          }
        `}>
          <div className="bg-primary text-white p-3 rounded-t-xl font-semibold flex justify-between items-center">
            <span>Stella 💬 — Eldady Assistant</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="h-6 w-6 p-0 hover:bg-primary/80"
            >
              <FaTimes size={12} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-primary text-white ml-auto"
                    : "bg-gray-100 text-gray-800 mr-auto"
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            ))}
            {isTyping && (
              <div className="bg-gray-100 text-gray-600 p-2 rounded-lg mr-auto inline-block animate-pulse">
                Stella is typing<span className="animate-ping">...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      )}
    </>
  );

  // Return based on mobile/desktop
  if (isMobile) {
    return (
      <>
        <div className={`
          fixed inset-0 bg-black/50 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `} onClick={onClose} />
        <div className={`
          fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {sidebarContent}
        </div>
        {stellaChat}
      </>
    );
  }

  // Desktop version
  return (
    <>
      {sidebarContent}
      {stellaChat}
    </>
  );
}
