import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { pl } from '../lib/i18n/pl';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react';
import EmailCollectionModal from '../components/EmailCollectionModal';
import Toast from '../components/Toast';

interface Expert {
  id: number;
  name: string;
  image?: string;
  specialization?: string;
}

export default function Chat() {
  const { clientProfileId, expertId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<any[]>([]);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!clientProfileId || !expertId) return;

    Promise.all([
      api.getMessages(clientProfileId, parseInt(expertId)),
      api.getClientProfile(clientProfileId),
      supabase.from('experts').select('*').eq('id', parseInt(expertId)).maybeSingle(),
    ])
      .then(([msgs, profile, expertResult]) => {
        setMessages(msgs);
        if (profile?.email) setClientEmail(profile.email);
        setExpert(expertResult.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [clientProfileId, expertId]);

  useEffect(() => {
    if (!clientProfileId || !expertId) return;

    const channel = supabase
      .channel(`client-chat-${clientProfileId}-${expertId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `client_profile_id=eq.${clientProfileId}`,
        },
        (payload) => {
          if (payload.new.expert_id !== parseInt(expertId)) return;
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `client_profile_id=eq.${clientProfileId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientProfileId, expertId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !clientProfileId || !expertId) return;

    if (!clientEmail) {
      setPendingMessage(newMessage);
      setShowEmailModal(true);
      return;
    }

    await sendMessageWithEmail(newMessage, clientEmail);
  };

  const sendMessageWithEmail = async (content: string, email: string) => {
    setIsSending(true);
    try {
      const message = await api.sendMessage(clientProfileId!, parseInt(expertId!), content, email);
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      setPendingMessage(null);
      if (!clientEmail) {
        setClientEmail(email);
        setToast({ message: pl.chat.emailSaved, type: 'success' });
      }
    } catch (error: any) {
      setToast({ message: error.message || pl.chat.sendError, type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailSubmit = async (email: string) => {
    if (pendingMessage) {
      await sendMessageWithEmail(pendingMessage, email);
      setShowEmailModal(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return pl.chat.today;
    if (date.toDateString() === yesterday.toDateString()) return pl.chat.yesterday;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const groupedMessages = () => {
    const groups: { date: string; messages: any[] }[] = [];
    messages.forEach((msg) => {
      const dateLabel = formatDate(msg.created_at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateLabel) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: dateLabel, messages: [msg] });
      }
    });
    return groups;
  };

  const lastClientMessage = [...messages].reverse().find((m) => m.sender === 'client');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">{pl.chat.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-neutral-50 flex flex-col">
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-neutral-600 hover:text-neutral-900 transition-colors p-1 rounded-lg hover:bg-neutral-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {expert?.image ? (
              <img
                src={expert.image}
                alt={expert.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-700 text-sm font-bold">
                  {expert?.name?.charAt(0) || 'T'}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-neutral-900 truncate">
                {expert?.name || pl.chat.yourTrainer}
              </h2>
              <p className="text-xs text-neutral-500 truncate">
                {expert?.specialization || pl.chat.personalTrainer}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  {expert?.image ? (
                    <img src={expert.image} alt={expert.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <span className="text-emerald-700 text-xl font-bold">
                      {expert?.name?.charAt(0) || 'T'}
                    </span>
                  )}
                </div>
                <p className="text-neutral-600 font-medium">{expert?.name || pl.chat.yourTrainer}</p>
                <p className="text-neutral-400 text-sm mt-1">{pl.chat.emptyStateHint}</p>
              </div>
            )}

            {groupedMessages().map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-neutral-200" />
                  <span className="text-xs text-neutral-400 font-medium">{group.date}</span>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>

                <div className="space-y-3">
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'expert' && expert?.image && (
                        <img
                          src={expert.image}
                          alt={expert.name}
                          className="w-7 h-7 rounded-full object-cover mr-2 mt-1 flex-shrink-0"
                        />
                      )}
                      {message.sender === 'expert' && !expert?.image && (
                        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <span className="text-emerald-700 text-xs font-bold">
                            {expert?.name?.charAt(0) || 'T'}
                          </span>
                        </div>
                      )}

                      <div
                        className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl ${
                          message.sender === 'client'
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${message.sender === 'client' ? 'text-emerald-100' : 'text-neutral-400'}`}>
                            {formatTime(message.created_at)}
                          </span>
                          {message.sender === 'client' && message.id === lastClientMessage?.id && (
                            message.read_at ? (
                              <CheckCheck className="w-3 h-3 text-emerald-200" title="Read" />
                            ) : (
                              <Check className="w-3 h-3 text-emerald-300" title="Sent" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white border-t border-neutral-200">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={pl.chat.placeholder}
              className="flex-1 px-4 py-2.5 bg-neutral-100 border border-transparent rounded-xl focus:outline-none focus:border-emerald-300 focus:bg-white transition-colors text-sm"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{pl.chat.send}</span>
            </button>
          </form>
        </div>
      </div>

      <EmailCollectionModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setPendingMessage(null);
        }}
        onSubmit={handleEmailSubmit}
        title={pl.chat.stayConnectedTitle}
        message={pl.chat.stayConnectedMsg}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
