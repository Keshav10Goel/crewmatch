
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type ConnectionRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  headline: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type ChatItem = {
  conversationId: string;
  connectionId: string;
  person: Profile;
  lastMessage: MessageRow | null;
  unreadCount: number;
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "U"
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();

  return sameDay
    ? date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
}

export function MessagesClient() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active =
    items.find((item) => item.conversationId === activeId) ?? null;

  // Insert or update a message without creating duplicates.
  const mergeMessage = useCallback((incoming: MessageRow) => {
    setMessages((current) => {
      const existingIndex = current.findIndex(
        (message) => message.id === incoming.id
      );

      if (existingIndex === -1) {
        return [...current, incoming].sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
      }

      return current.map((message) =>
        message.id === incoming.id
          ? { ...message, ...incoming }
          : message
      );
    });
  }, []);

  // Mark all unread incoming messages in this conversation as read.
  const markMessagesAsRead = useCallback(
    async (conversationId: string, currentUserId: string) => {
      const { data, error: readError } = await supabase
        .from("messages")
        .update({
          read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .eq("recipient_id", currentUserId)
        .neq("sender_id", currentUserId)
        .is("read_at", null)
        .select(
          "id, conversation_id, sender_id, recipient_id, body, read_at, created_at"
        );

      if (readError) {
        console.error("Failed to mark messages as read:", readError);
        throw readError;
      }

      if (data && data.length > 0) {
        const updatedMessages = data as MessageRow[];

        setMessages((current) =>
          current.map((message) => {
            const updated = updatedMessages.find(
              (item) => item.id === message.id
            );

            return updated ? { ...message, ...updated } : message;
          })
        );
      }

      setItems((current) =>
        current.map((item) =>
          item.conversationId === conversationId
            ? { ...item, unreadCount: 0 }
            : item
        )
      );
    },
    [supabase]
  );

  // Load accepted connections and create/open their conversations.
  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const currentUser = authData.user;

      if (!currentUser) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      setUserId(currentUser.id);

      const { data: connections, error: connectionsError } = await supabase
        .from("connections")
        .select("id, requester_id, recipient_id, created_at")
        .eq("status", "accepted")
        .or(
          `requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`
        )
        .order("updated_at", { ascending: false });

      if (connectionsError) throw connectionsError;

      const connectionRows = (connections ?? []) as ConnectionRow[];

      if (connectionRows.length === 0) {
        setItems([]);
        setActiveId("");
        setMessages([]);
        return;
      }

      const otherIds = [
        ...new Set(
          connectionRows.map((connection) =>
            connection.requester_id === currentUser.id
              ? connection.recipient_id
              : connection.requester_id
          )
        ),
      ];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, headline")
        .in("id", otherIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        ((profiles ?? []) as Profile[]).map((profile) => [
          profile.id,
          profile,
        ])
      );

      const chatItems = await Promise.all(
        connectionRows.map(async (connection) => {
          const otherId =
            connection.requester_id === currentUser.id
              ? connection.recipient_id
              : connection.requester_id;

          const person = profileMap.get(otherId);

          if (!person) return null;

          const { data: conversationId, error: conversationError } =
            await supabase.rpc("get_or_create_direct_conversation", {
              p_connection_id: connection.id,
            });

          if (conversationError) throw conversationError;

          if (typeof conversationId !== "string") {
            throw new Error("Could not open this conversation.");
          }

          const [latestResult, unreadResult] = await Promise.all([
            supabase
              .from("messages")
              .select(
                "id, conversation_id, sender_id, recipient_id, body, read_at, created_at"
              )
              .eq("conversation_id", conversationId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),

            supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conversationId)
              .eq("recipient_id", currentUser.id)
              .is("read_at", null),
          ]);

          if (latestResult.error) throw latestResult.error;
          if (unreadResult.error) throw unreadResult.error;

          return {
            conversationId,
            connectionId: connection.id,
            person,
            lastMessage: (latestResult.data as MessageRow | null) ?? null,
            unreadCount: unreadResult.count ?? 0,
          } satisfies ChatItem;
        })
      );

      const validItems = chatItems.filter(
        (item): item is ChatItem => item !== null
      );

      validItems.sort((a, b) => {
        const timeA = a.lastMessage
          ? new Date(a.lastMessage.created_at).getTime()
          : 0;

        const timeB = b.lastMessage
          ? new Date(b.lastMessage.created_at).getTime()
          : 0;

        return timeB - timeA;
      });

      setItems(validItems);

      setActiveId((current) =>
        current && validItems.some((item) => item.conversationId === current)
          ? current
          : validItems[0]?.conversationId ?? ""
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load your messages."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load messages and mark incoming unread messages as read.
  const loadMessages = useCallback(
    async (conversationId: string, currentUserId: string) => {
      setLoadingChat(true);
      setError("");

      try {
        const { data, error: messagesError } = await supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, recipient_id, body, read_at, created_at"
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(200);

        if (messagesError) throw messagesError;

        setMessages((data ?? []) as MessageRow[]);

        await markMessagesAsRead(conversationId, currentUserId);
      } catch (caught) {
        console.error("Could not load conversation:", caught);

        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load this conversation."
        );
      } finally {
        setLoadingChat(false);
      }
    },
    [supabase, markMessagesAsRead]
  );

  // Initial inbox load.
  useEffect(() => {
    void Promise.resolve().then(() => loadInbox());
  }, [loadInbox]);

  // Load the selected conversation.
  useEffect(() => {
    if (!activeId || !userId) return;

    void Promise.resolve().then(() => loadMessages(activeId, userId));
  }, [activeId, userId, loadMessages]);

  // Listen for new messages and read-receipt updates.
  useEffect(() => {
    if (!activeId || !userId) return;

    const channel = supabase
      .channel(`crewmatch-chat-${activeId}`)

      // A new message has arrived.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRow;

          mergeMessage(incoming);

          setItems((current) =>
            current.map((item) =>
              item.conversationId === activeId
                ? {
                    ...item,
                    lastMessage: incoming,
                    unreadCount:
                      incoming.recipient_id === userId
                        ? 0
                        : item.unreadCount,
                  }
                : item
            )
          );

          // If the current user received this message,
          // mark it as read because this conversation is open.
          if (
            incoming.recipient_id === userId &&
            incoming.sender_id !== userId &&
            !incoming.read_at
          ) {
            void markMessagesAsRead(activeId, userId).catch((caught) => {
              console.error("Realtime read receipt failed:", caught);
            });
          }
        }
      )

      // A message's read_at value has changed.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const updated = payload.new as MessageRow;

          // Update the existing message, including its read_at value.
          mergeMessage(updated);

          setItems((current) =>
            current.map((item) =>
              item.conversationId === activeId
                ? {
                    ...item,
                    lastMessage:
                      item.lastMessage?.id === updated.id
                        ? updated
                        : item.lastMessage,
                  }
                : item
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Chat realtime subscription status:", status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    activeId,
    userId,
    supabase,
    mergeMessage,
    markMessagesAsRead,
  ]);

  // Keep the latest message visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // Send a message.
  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();

    if (!body || !active || !userId || sending) return;

    if (body.length > 5000) {
      setError("Messages can contain up to 5,000 characters.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data, error: sendError } = await supabase
        .from("messages")
        .insert({
          conversation_id: active.conversationId,
          sender_id: userId,
          recipient_id: active.person.id,
          body,
        })
        .select(
          "id, conversation_id, sender_id, recipient_id, body, read_at, created_at"
        )
        .single();

      if (sendError) throw sendError;

      const sent = data as MessageRow;

      mergeMessage(sent);

      setItems((current) =>
        current.map((item) =>
          item.conversationId === active.conversationId
            ? { ...item, lastMessage: sent }
            : item
        )
      );

      setDraft("");
      inputRef.current?.focus();
    } catch (caught) {
      console.error("Message send failed:", caught);

      setError(
        caught instanceof Error
          ? caught.message
          : "Message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  const filteredItems = items.filter(
    (item) =>
      item.person.full_name.toLowerCase().includes(search.toLowerCase()) ||
      item.person.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm text-violet-300">Direct collaboration</p>
        <h1 className="mt-2 text-3xl font-semibold">Messages</h1>
        <p className="mt-2 text-sm text-slate-400">
          Chat privately with your accepted CrewMatch connections.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      <div className="panel grid min-h-[620px] overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          className={`${
            activeId ? "hidden lg:flex" : "flex"
          } min-h-[620px] flex-col border-r border-white/5`}
        >
          <div className="border-b border-white/5 p-4">
            <h2 className="font-semibold">Your conversations</h2>

            <div className="relative mt-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                className="field pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search connections"
                aria-label="Search conversations"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400">
                <Loader2 className="animate-spin" size={17} />
                Loading conversations
              </div>
            ) : filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  type="button"
                  key={item.conversationId}
                  onClick={() => {
                    setMessages([]);
                    setError("");
                    setActiveId(item.conversationId);
                  }}
                  className={`flex w-full items-center gap-3 border-b border-white/5 p-4 text-left transition hover:bg-white/[0.04] ${
                    activeId === item.conversationId
                      ? "bg-violet-400/10"
                      : ""
                  }`}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-400/15 font-semibold text-violet-200">
                    {item.person.avatar_url ? (
                      <img
                        src={item.person.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(item.person.full_name)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {item.person.full_name}
                      </p>

                      <span className="shrink-0 text-[11px] text-slate-500">
                        {item.lastMessage
                          ? formatTime(item.lastMessage.created_at)
                          : ""}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {item.lastMessage?.body ?? "Start a conversation"}
                    </p>
                  </div>

                  {item.unreadCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
                      {item.unreadCount > 9 ? "9+" : item.unreadCount}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-7 text-center">
                <MessageCircle
                  size={25}
                  className="mx-auto text-slate-500"
                />
                <p className="mt-3 text-sm font-medium">
                  {items.length
                    ? "No matching connections"
                    : "No conversations yet"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {items.length
                    ? "Try another name or username."
                    : "Accept a connection request to start chatting. Your accepted connections will appear here."}
                </p>
              </div>
            )}
          </div>
        </aside>

        <div
          className={`${
            activeId ? "flex" : "hidden lg:flex"
          } min-h-[620px] flex-col`}
        >
          {active ? (
            <>
              <header className="flex items-center gap-3 border-b border-white/5 px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={() => setActiveId("")}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-violet-400/15 font-semibold text-violet-200">
                  {active.person.avatar_url ? (
                    <img
                      src={active.person.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(active.person.full_name)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {active.person.full_name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    @{active.person.username}
                  </p>
                </div>

                <span className="hidden items-center gap-1.5 text-xs text-emerald-300 sm:flex">
                  <ShieldCheck size={15} />
                  Accepted connection
                </span>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                <div className="mx-auto flex max-w-sm items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-2 text-center text-[11px] leading-4 text-slate-500">
                  <ShieldCheck size={14} className="shrink-0" />
                  Messages are available only between accepted connections.
                </div>

                {loadingChat ? (
                  <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-400">
                    <Loader2 size={17} className="animate-spin" />
                    Loading messages
                  </div>
                ) : messages.length ? (
                  messages.map((message) => {
                    const own = message.sender_id === userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          own ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${
                            own
                              ? "rounded-br-md bg-violet-600 text-white"
                              : "rounded-bl-md border border-white/5 bg-[#1a2030] text-slate-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.body}
                          </p>

                          <div
                            className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                              own
                                ? "text-violet-100/70"
                                : "text-slate-500"
                            }`}
                          >
                            {formatTime(message.created_at)}

                            {own &&
                              (message.read_at ? (
                                <CheckCheck size={13} />
                              ) : (
                                <Check size={13} />
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center text-center">
                    <UserRound size={28} className="text-slate-500" />
                    <p className="mt-3 text-sm font-medium">
                      Start the conversation
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Say hello and discuss what you can build together.
                    </p>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="border-t border-white/5 p-3 sm:p-4"
              >
                <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#0c101a] p-2">
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    maxLength={5000}
                    placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                    aria-label="Message"
                    className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                  />

                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="btn btn-primary mb-0.5 h-10 w-10 shrink-0 !rounded-xl !p-0 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </div>

                <p className="mt-2 px-1 text-[10px] text-slate-600">
                  {draft.length}/5000 characters
                </p>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-violet-300/15 bg-violet-400/10 text-violet-200">
                <MessageCircle size={28} />
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                Your collaboration inbox
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Select an accepted connection to discuss hackathons,
                projects, roles and ideas in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
