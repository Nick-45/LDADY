import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient"; // ✅ import your Vite Supabase client
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import StartConversationModal from "@/components/messages/StartConversationModal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FaPlus, FaSearch } from "react-icons/fa";

export default function Messages() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
  }, []);

  // Fetch conversations from Supabase
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ["conversations", currentUser?.id],
    enabled: !!currentUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          user_id,
          other_user:user_id!inner (
            id,
            first_name,
            last_name,
            profile_image_url
          ),
          last_message,
          last_message_time
        `)
        .or(`user_id.eq.${currentUser?.id},other_user.id.eq.${currentUser?.id}`)
        .order("last_message_time", { ascending: false });

      if (error) throw error;
      return data;
    },
    retry: false,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Deduplicate conversations by userId
  const uniqueConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    const seen = new Set<string>();
    return conversations.filter((conv: any) => {
      const otherId = conv.other_user.id;
      if (seen.has(otherId)) return false;
      seen.add(otherId);
      return true;
    });
  }, [conversations]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    return uniqueConversations.filter((conversation: any) => {
      const fullName = `${conversation.other_user?.first_name || ""} ${conversation.other_user?.last_name || ""}`.toLowerCase();
      const lastMessage = conversation.last_message?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || lastMessage.includes(query);
    });
  }, [uniqueConversations, searchQuery]);

  if (!currentUser || !currentUser.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 ml-64">
        <div className="flex h-screen">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-300 bg-gray-50 shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-gray-300 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Chats</h2>
                <Button
                  size="sm"
                  onClick={() => setShowStartConversation(true)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 p-0 shadow-md"
                >
                  <FaPlus className="w-5 h-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-3 border-gray-300 rounded-xl bg-gray-100 focus:bg-white focus:border-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="overflow-y-auto bg-gray-50">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 flex items-center space-x-4 bg-white rounded-xl mx-2 shadow-sm"
                    >
                      <Skeleton className="w-14 h-14 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="p-2 space-y-2">
                  {filteredConversations.map((conversation: any) => {
                    const unreadCount = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 hover:bg-gray-100 transition-all duration-200 cursor-pointer rounded-xl mx-1 shadow-sm ${
                          selectedUserId === conversation.other_user.id
                            ? "bg-blue-100 border-l-4 border-l-blue-500"
                            : "bg-white border-l-4 border-l-transparent"
                        }`}
                        onClick={() => setSelectedUserId(conversation.other_user.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            {conversation.other_user?.profile_image_url ? (
                              <img
                                src={conversation.other_user.profile_image_url}
                                alt="User avatar"
                                className="w-14 h-14 rounded-full object-cover shadow-md"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-lg">
                                  {conversation.other_user?.first_name?.[0] || "?"}
                                </span>
                              </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate text-base">
                                  {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                                </p>
                                <p className="text-sm text-gray-500 truncate mt-1">
                                  {conversation.last_message}
                                </p>
                              </div>

                              <div className="flex flex-col items-end space-y-2 ml-3">
                                <span className="text-xs text-gray-400 font-medium">
                                  {new Date(conversation.last_message_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {unreadCount > 0 && (
                                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[22px] h-6 flex items-center justify-center shadow-md">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No conversations match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No conversations yet.</p>
                  <p className="text-sm mt-1">Start chatting with product sellers!</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedUserId ? (
            <ChatArea userId={selectedUserId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <FaPlus className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No conversation selected</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Conversation Modal */}
      <StartConversationModal
        isOpen={showStartConversation}
        onClose={() => setShowStartConversation(false)}
        onConversationStarted={(userId) => setSelectedUserId(userId)}
      />
    </div>
  );
}
