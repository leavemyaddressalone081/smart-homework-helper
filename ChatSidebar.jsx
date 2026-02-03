import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, MessageSquare, MoreVertical, Pencil, ThumbsUp, ThumbsDown, 
  EyeOff, Eye, Share2, Trash2, X, Menu
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatSidebar({ 
  chats, 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  onUpdateChat,
  onDeleteChat,
  showHidden,
  setShowHidden,
  isOpen,
  setIsOpen,
  user
}) {
  const [renameDialog, setRenameDialog] = useState({ open: false, chat: null, title: '' });
  const [shareDialog, setShareDialog] = useState({ open: false, chat: null, email: '' });
  const [isSending, setIsSending] = useState(false);

  const handleRename = async () => {
    if (renameDialog.chat && renameDialog.title.trim()) {
      await onUpdateChat(renameDialog.chat.id, { title: renameDialog.title.trim() });
      setRenameDialog({ open: false, chat: null, title: '' });
    }
  };

  const handleToggleLike = async (chat, liked) => {
    await onUpdateChat(chat.id, { is_liked: liked });
  };

  const handleToggleHide = async (chat) => {
    await onUpdateChat(chat.id, { is_hidden: !chat.is_hidden });
  };

  const handleShare = async () => {
    if (!shareDialog.email.trim() || !shareDialog.chat) return;
    setIsSending(true);
    
    const messagesText = shareDialog.chat.messages
      ?.map(m => `${m.role === 'user' ? 'Question' : 'Answer'}: ${m.content}`)
      .join('\n\n') || 'No messages';

    await base44.integrations.Core.SendEmail({
      to: shareDialog.email,
      subject: `Shared Chat: ${shareDialog.chat.title}`,
      body: `Here's a homework help chat shared with you:\n\n${messagesText}`
    });

    setIsSending(false);
    setShareDialog({ open: false, chat: null, email: '' });
  };

  const filteredChats = chats.filter(c => showHidden || !c.is_hidden);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed md:relative z-40 h-full w-72 bg-gray-900 text-white flex flex-col`}
          >
            {/* Logo */}
            <div className="p-4 border-b border-gray-700">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698099fe9a117c77d072de88/605153c51_image.png"
                alt="Smart Homework Assistant"
                className="w-full h-auto"
              />
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <Button
                onClick={onNewChat}
                className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>

            {/* Show Hidden Toggle */}
            <div className="px-3 pb-2">
              <button
                onClick={() => setShowHidden(!showHidden)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                {showHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showHidden ? 'Hide hidden chats' : 'Show hidden chats'}
              </button>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-1">
                {filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      currentChatId === chat.id 
                        ? 'bg-gray-700' 
                        : 'hover:bg-gray-800'
                    } ${chat.is_hidden ? 'opacity-50' : ''}`}
                    onClick={() => onSelectChat(chat)}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {chat.title}
                    </span>
                    {chat.is_liked && <ThumbsUp className="w-3 h-3 text-green-400" />}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setRenameDialog({ open: true, chat, title: chat.title })}>
                          <Pencil className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleLike(chat, !chat.is_liked)}>
                          {chat.is_liked ? (
                            <><ThumbsDown className="w-4 h-4 mr-2" /> Unlike</>
                          ) : (
                            <><ThumbsUp className="w-4 h-4 mr-2" /> Like</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleHide(chat)}>
                          {chat.is_hidden ? (
                            <><Eye className="w-4 h-4 mr-2" /> Unhide</>
                          ) : (
                            <><EyeOff className="w-4 h-4 mr-2" /> Hide</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShareDialog({ open: true, chat, email: '' })}>
                          <Share2 className="w-4 h-4 mr-2" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => onDeleteChat(chat.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </ScrollArea>


          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => !open && setRenameDialog({ open: false, chat: null, title: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDialog.title}
            onChange={(e) => setRenameDialog(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Chat name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, chat: null, title: '' })}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialog.open} onOpenChange={(open) => !open && setShareDialog({ open: false, chat: null, email: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Chat via Email</DialogTitle>
          </DialogHeader>
          <Input
            type="email"
            value={shareDialog.email}
            onChange={(e) => setShareDialog(prev => ({ ...prev, email: e.target.value }))}
            placeholder="recipient@email.com"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialog({ open: false, chat: null, email: '' })}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
