import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatSidebar from '../components/ChatSidebar';

const INAPPROPRIATE_WORDS = [
"suicidal", "kill myself", "killmyself", "kms", "end my life", "hang myself", "cut myself", "selfharm", "slit wrist", 
"gore", "blood", "bloody", "killing", "stab", "stabbing", "shoot", "shooting", "gun", "knife", "weapon", "mutilate",
"sex", "sexy", "porn", "porno", "pornography", "xxx", "nude", "naked", "strip", "stripper", "masturbate", "masturbation"
  , "orgasm", "boob", "boobs", "tit", "tits", "breast", "breasts", "bobs", "boobies", "dick", "cock", "penis", "vagina"
  , "pussy", "puss", "ass", "butt", "anal", "oral", "blowjob", "handjob", "rape", "molest", "pedophile", "child porn", 
  "loli", "hentai", "nsfw","fuck", "fucking", "fucked", "fucker", "fck", "fuk", "frick", 
  "fricking", "shit", "shitty", "sht", "crap", "crappy", "damn", "dammit", "damm", "hell", "bitch", "bitching", "bastard"
  , "asshole", "a$$hole", "motherfucker", "mf", "wtf", "stfu", "bullshit", "bs",
  "buy drug", "purchase drugs", "weed", "marijuana", "cocaine", "heroin", "meth", "ecstasy", "beer", "vodka",
  "diddy", "didy", "epstein", "weinstein", "cosby", "goon", "gooning", "onlyfans", "chaturbate", "pornhub",
  "nigga", "nigger", "n1gga", "n1gger", "negro", "coon", "chink", "gook", "spic", "wetback", "beaner", "fag", "faggot", "dyke", "tranny", "trannie",
  "kkk", "white power", "supremacist","retard", "retarded", "idiot", "stupid", "dumb", "moron", "ugly", "fat", "loser", "worthless", "pathetic", "weak",
  "whore", "slut", "hoe", "thot", "simp", "hack", "hacking", "cheat", "pirate", "steal", "scam", "bomb", "terrorist", "terrorism", "explosion",
   "abortion", "viagra", "cialis", 
"a$$", "b!tch", "sh!t", "fvck", "phuck", "azz",

const containsInappropriateContent = (text) => {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return INAPPROPRIATE_WORDS.some(word => cleaned.includes(word));
};

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (!text) return;
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);
  
  return <span>{displayedText}{!isComplete && <span className="animate-pulse">|</span>}</span>;
};

export default function HomeworkHelper() {
  const [question, setQuestion] = useState('');
  const [currentMessages, setCurrentMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: () => base44.entities.Chat.list('-created_date'),
    enabled: !!user,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setCurrentMessages([]);
  };

  const handleSelectChat = (chat) => {
    setCurrentChatId(chat.id);
    setCurrentMessages(chat.messages || []);
    setSidebarOpen(false);
  };

  const handleUpdateChat = async (id, data) => {
    await base44.entities.Chat.update(id, data);
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  };

  const handleDeleteChat = async (id) => {
    await base44.entities.Chat.delete(id);
    if (currentChatId === id) {
      handleNewChat();
    }
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  };

  const saveChat = async (messages, chatId = null) => {
    if (!user) return null;
    
    const title = messages[0]?.content?.slice(0, 50) || 'New Chat';
    
    if (chatId) {
      await base44.entities.Chat.update(chatId, { messages });
      return chatId;
    } else {
      const newChat = await base44.entities.Chat.create({ title, messages });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      return newChat.id;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion('');
    
    const newMessages = [...currentMessages, { role: 'user', content: userQuestion }];
    setCurrentMessages(newMessages);

    if (containsInappropriateContent(userQuestion)) {
      const finalMessages = [...newMessages, { 
        role: 'assistant', 
        content: "I'm sorry, but I can only help with appropriate homework questions. Please ask something related to your studies! 📚" 
      }];
      setCurrentMessages(finalMessages);
      if (user) {
        const id = await saveChat(finalMessages, currentChatId);
        if (!currentChatId) setCurrentChatId(id);
      }
      return;
    }

    setIsLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a friendly, helpful homework tutor for students.
      
The student asks: "${userQuestion}"

Provide a clear, step-by-step explanation that's easy to understand. Use simple language and break down complex concepts. If it's a math problem, show each step clearly. Keep your response focused and educational.`,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" }
        }
      }
    });

    const finalMessages = [...newMessages, { role: 'assistant', content: response.answer }];
    setCurrentMessages(finalMessages);
    
    if (user) {
      const id = await saveChat(finalMessages, currentChatId);
      if (!currentChatId) setCurrentChatId(id);
    }
    
    setIsLoading(false);
    inputRef.current?.focus();
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }



  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onUpdateChat={handleUpdateChat}
        onDeleteChat={handleDeleteChat}
        showHidden={showHidden}
        setShowHidden={setShowHidden}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Homework Helper
            </h1>
            <p className="text-gray-600 mt-1">Ask any question and get step-by-step help</p>
          </div>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to help!</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Type your homework question below.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {currentMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.role === 'assistant' && idx === currentMessages.length - 1 ? (
                            <TypewriterText text={msg.content} />
                          ) : (
                            msg.content
                          )}
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4 bg-gray-50/50">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask your homework question..."
                  className="flex-1 py-6 rounded-xl border-gray-200 bg-white"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!question.trim() || isLoading}
                  className="px-6 py-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
