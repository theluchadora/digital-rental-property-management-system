import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Paperclip, Image as ImageIcon, Edit, ArrowLeft, Search, CheckCircle, X, Flag } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api/messages";
import { notificationsApi } from "@/lib/api/notifications";
import { usersApi } from "@/lib/api/users";
import { subscribeToEvent } from "@/lib/websocket";
import apiClient from "@/lib/api-client";
import { PageLoader } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation, Message, User } from "@/types/api";


export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlUserId = searchParams.get("userId");
  
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: () => usersApi.search(debouncedSearch),
    enabled: newChatOpen && debouncedSearch.length >= 2,
  });

  // Queries
  const { data: conversationsResponse, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: messagesApi.getConversations,
    refetchInterval: false,
  });
  const conversations = useMemo(() => conversationsResponse?.data?.conversations || [], [conversationsResponse]);

  const activeConv = conversations.find(c => c.id === selectedConvId) ||
    (urlUserId ? conversations.find(c => c.participantAId === urlUserId || c.participantBId === urlUserId) : undefined);

  const otherUserId = activeConv 
    ? (activeConv.participantAId === user?.id ? activeConv.participantBId : activeConv.participantAId)
    : (urlUserId || undefined);

  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", otherUserId],
    queryFn: () => messagesApi.list({ otherUserId, limit: 100 }),
    enabled: !!otherUserId,
    refetchInterval: false,
  });
  // Messages are returned DESC by API, we need them ASC for rendering
  const messages = useMemo(() => [...(messagesResponse?.data?.data || [])].reverse(), [messagesResponse]);

  const markConversationRead = useCallback(
    async (partnerId: string) => {
      if (!user?.id || !partnerId) return;
      const readAt = new Date().toISOString();
      try {
        await messagesApi.markConversationRead(partnerId);
        queryClient.setQueryData(["messages", partnerId], (old: unknown) => {
          const prev = old as { data?: { data?: Message[] } } | undefined;
          if (!prev?.data?.data) return old;
          return {
            ...prev,
            data: {
              ...prev.data,
              data: prev.data.data.map((m) =>
                m.receiverId === user.id
                  ? { ...m, readAt: m.readAt || readAt, isRead: true }
                  : m
              ),
            },
          };
        });
        queryClient.setQueryData(
          ["conversations"],
          (old: { data?: { conversations?: Conversation[] } } | undefined) => {
            if (!old?.data?.conversations) return old;
            return {
              ...old,
              data: {
                ...old.data,
                conversations: old.data.conversations.map((c) => {
                  const partner =
                    c.participantAId === user.id ? c.participantBId : c.participantAId;
                  if (partner !== partnerId) return c;
                  if (!c.lastMessage || c.lastMessage.receiverId !== user.id) return c;
                  return {
                    ...c,
                    lastMessage: {
                      ...c.lastMessage,
                      readAt: c.lastMessage.readAt || readAt,
                      isRead: true,
                    },
                  };
                }),
              },
            };
          }
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["sidebar-badges"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch (e) {
        console.error("Failed to mark conversation as read:", e);
      }
    },
    [queryClient, user?.id]
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (otherUserId) {
      markConversationRead(otherUserId);
    }
  }, [otherUserId, markConversationRead]);

  useEffect(() => {
    if (urlUserId && !selectedConvId) {
      const match = conversations.find(c => c.participantAId === urlUserId || c.participantBId === urlUserId);
      if (match) {
        setSelectedConvId(match.id);
        setShowChat(true);
      } else {
        setShowChat(true);
      }
    }
  }, [urlUserId, conversations, selectedConvId]);

  useEffect(() => {
    const unsubscribe = subscribeToEvent("NEW_MESSAGE", (rawMsg: any) => {
      const msg = rawMsg as Message & { tempId?: string };
      if (msg && (msg.senderId === otherUserId || msg.receiverId === otherUserId)) {
        queryClient.setQueryData(["messages", otherUserId], (old: any) => {
          if (!old || !old.data || !old.data.data) return old;
          if (msg.tempId) {
             const idx = old.data.data.findIndex((m: Message) => m.id === msg.tempId);
             if (idx !== -1) {
               const newData = [...old.data.data];
               newData[idx] = msg;
               return { ...old, data: { ...old.data, data: newData } };
             }
          }
          if (old.data.data.some((m: Message) => m.id === msg.id)) return old;
          return { ...old, data: { ...old.data, data: [msg, ...old.data.data] } };
        });
      }
      queryClient.invalidateQueries({ queryKey: ["messages", otherUserId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      if (msg?.senderId && msg.senderId !== user?.id) {
        markConversationRead(msg.senderId);
      }
      queryClient.invalidateQueries({ queryKey: ["sidebar-badges"] });
    });
    return unsubscribe;
  }, [otherUserId, queryClient, user?.id, markConversationRead]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: messagesApi.send,
    onError: () => {
      toast({ title: "Failed to send", description: "Could not send message", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", otherUserId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  const handleSelectConv = (id: string) => {
    setSelectedConvId(id);
    setShowChat(true);
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      const partnerId =
        conv.participantAId === user?.id ? conv.participantBId : conv.participantAId;
      markConversationRead(partnerId);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post("/upload/message-attachment", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    // the backend will serve files statically under the base URL
    return `${apiClient.defaults.baseURL?.replace('/api/v1', '')}${data.filePath}`;
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachedFile) || !otherUserId) return;
    
    try {
      setIsUploading(true);
      let content = newMessage.trim();
      
      if (attachedFile) {
        const fileUrl = await uploadFile(attachedFile);
        content = `📎 [Attachment: ${attachedFile.name}](${fileUrl})\n${content}`;
      }

      const tempId = `opt-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        senderId: user?.id || "",
        receiverId: otherUserId,
        subject: "Direct Message",
        content,
        conversationId: selectedConvId || "temp",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: user || undefined,
        isOptimistic: true,
      };

      queryClient.setQueryData(["messages", otherUserId], (old: any) => {
        if (!old || !old.data || !old.data.data) return old;
        return { ...old, data: { ...old.data, data: [optimisticMsg, ...old.data.data] } };
      });

      // Try sending via WebSocket first
      const { sendWebSocketMessage } = await import("@/lib/websocket");
      const sentViaWs = sendWebSocketMessage("SEND_MESSAGE", {
        tempId,
        senderId: user?.id,
        receiverId: otherUserId,
        subject: "Direct Message",
        content,
      });

      if (!sentViaWs) {
        // Fallback to REST if WS is not ready
        await sendMessageMutation.mutateAsync({
          receiverId: otherUserId,
          subject: "Direct Message",
          content,
        });
      }

      setNewMessage("");
      setAttachedFile(null);
    } catch (e) {
      toast({ title: "Error", description: "Failed to upload file or send message", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    }
  };

  // Helper for rendering other user in a conversation
  const getOtherUser = (conv: Conversation) => {
    return conv.participantAId === user?.id ? conv.participantB : conv.participantA;
  };

  const startChatWithUser = useCallback(
    (targetUser: User) => {
      if (targetUser.id === user?.id) {
        toast({ title: "Cannot message yourself", variant: "destructive" });
        return;
      }
      const existing = conversations.find(
        (c) => c.participantAId === targetUser.id || c.participantBId === targetUser.id
      );
      setNewChatOpen(false);
      setSearchQuery("");
      if (existing) {
        setSelectedConvId(existing.id);
        setShowChat(true);
        navigate(`/messages?userId=${targetUser.id}`);
      } else {
        setSelectedConvId(null);
        setShowChat(true);
        navigate(`/messages?userId=${targetUser.id}`);
      }
    },
    [conversations, navigate, toast, user?.id]
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] gap-0 overflow-hidden rounded-lg border border-border bg-card">
      {/* Conversation List */}
      <div className={`w-full md:w-80 shrink-0 border-r border-border ${showChat ? "hidden md:block" : "block"}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Inboxes</h2>
          <button className="text-secondary" onClick={() => setNewChatOpen(true)}>
            <Edit className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-border overflow-y-auto">
          {conversationsLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.map(conv => {
            const otherUser = getOtherUser(conv);
            const unread = conv.lastMessage?.receiverId === user?.id && !conv.lastMessage?.readAt;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv.id)}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${selectedConvId === conv.id ? "bg-muted" : "hover:bg-muted/50"}`}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground uppercase">
                    {otherUser?.firstName?.[0] || "?"}{otherUser?.lastName?.[0] || "?"}
                  </div>
                  {unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-secondary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{otherUser?.firstName} {otherUser?.lastName}</p>
                  </div>
                  {conv.property && <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{conv.property.title}</p>}
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage?.content || "No messages yet"}</p>
                </div>
              </button>
            )
          })}
          {!conversationsLoading && conversations.length === 0 && (
             <div className="p-4 text-center text-sm text-muted-foreground">No conversations</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex flex-1 flex-col ${!showChat ? "hidden md:flex" : "flex"}`}>
        {selectedConvId || otherUserId ? (
          <>
            <div className="flex items-center justify-between border-b border-border p-3 md:p-4">
              <div className="flex items-center gap-3">
                <button className="md:hidden text-muted-foreground" onClick={() => setShowChat(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground uppercase">
                  {activeConv ? getOtherUser(activeConv)?.firstName?.[0] : "?"}{activeConv ? getOtherUser(activeConv)?.lastName?.[0] : "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{activeConv ? `${getOtherUser(activeConv)?.firstName} ${getOtherUser(activeConv)?.lastName}` : "New Conversation"}</p>
                </div>
              </div>
              {/* Report User button */}
              {otherUserId && (
                <button
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Report this user"
                  onClick={() => navigate(`/report?reportedUserId=${otherUserId}`)}
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Report User</span>
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {messagesLoading && messages.length === 0 ? (
                <PageLoader label="Loading messages..." />
              ) : null}
              {messages.map((msg) => {
                const isSent = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"} gap-2 md:gap-3`}>
                    {!isSent && (
                      <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground uppercase">
                        {msg.sender?.firstName?.[0] || "?"}{msg.sender?.lastName?.[0] || "?"}
                      </div>
                    )}
                    <div className={`max-w-[80%] md:max-w-md rounded-lg p-3 md:p-4 ${isSent ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground"} ${msg.isOptimistic ? "opacity-70" : ""}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${isSent ? "text-secondary-foreground/70" : "text-muted-foreground"}`}>
                        {msg.isOptimistic && <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>}
                        <span>{new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached file preview */}
            {attachedFile && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                  <span className="truncate flex-1">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} disabled={isUploading}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            )}

            {/* Compose */}
            <div className="border-t border-border p-3 md:p-4">
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-foreground shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Paperclip className="h-5 w-5" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }} />
                <button className="text-muted-foreground hover:text-foreground shrink-0 hidden sm:block" onClick={() => imageInputRef.current?.click()} disabled={isUploading}>
                  <ImageIcon className="h-5 w-5" />
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }} />
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isUploading ? "Uploading..." : `Message ${activeConv ? getOtherUser(activeConv)?.firstName : "New Conversation"}...`}
                  className="flex-1"
                  disabled={isUploading}
                />
                <Button size="icon" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0" onClick={handleSend} disabled={isUploading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
            <Send className="h-12 w-12 opacity-20" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={(open) => { setNewChatOpen(open); if (!open) setSearchQuery(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {searchQuery.trim().length < 2 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Type at least 2 characters</p>
              ) : isSearching ? (
                <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => startChatWithUser(u)}
                    className="flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-muted transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground uppercase">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <p className="text-[10px] uppercase text-secondary">{u.role}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
