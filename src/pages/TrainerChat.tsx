import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { pl } from '../lib/i18n/pl';
import { ArrowLeft, Send, User, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

interface Expert {
  id: number;
  name: string;
  image?: string;
  specialization?: string;
}

export default function TrainerChat() {
  const { expertId, clientProfileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [messages, setMessages] = useState<any[]>([]);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expertId || !clientProfileId) return;

    const init = async () => {
      const [msgs, profile, expertData] = await Promise.all([
        api.getMessages(clientProfileId, parseInt(expertId)),
        api.getClientProfile(clientProfileId),
        supabase.from('experts').select('*').eq('id', parseInt(expertId)).maybeSingle(),
      ]);

      setMessages(msgs);
      setClientEmail(profile?.email || null);
      setExpert(expertData.data);

      await api.markMessagesAsRead(clientProfileId, parseInt(expertId));
      setIsLoading(false);
    };

    init().catch(() => setIsLoading(false));
  }, [expertId, clientProfileId]);

  useEffect(() => {
    if (!expertId || !clientProfileId) return;

    const channel = supabase
      .channel(`trainer-chat-${expertId}-${clientProfileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `client_profile_id=eq.${clientProfileId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          if (payload.new.sender === 'client') {
            api.markMessagesAsRead(clientProfileId!, parseInt(expertId!));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [expertId, clientProfileId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !clientProfileId || !expertId) return;

    setIsSending(true);
    try {
      const message = await api.sendExpertMessage(clientProfileId, parseInt(expertId), newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (error: any) {
      setToast({ message: error.message || pl.trainerChat.sendError, type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return pl.trainerChat.today;
    if (date.toDateString() === yesterday.toDateString()) return pl.trainerChat.yesterday;
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

  const handleBack = () => {
    const tokenParam = token ? `?token=${token}` : '';
    navigate(`/trainer/${expertId}${tokenParam}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">{pl.trainerChat.loading}</p>
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
              onClick={handleBack}
              className="text-neutral-600 hover:text-neutral-900 transition-colors p-1 rounded-lg hover:bg-neutral-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-neutral-900 truncate">
                {clientEmail || `Client ${clientProfileId?.slice(0, 8)}...`}
              </h2>
              <p className="text-xs text-neutral-500">{pl.trainerChat.replyingAsLabel(expert?.name || '')}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-neutral-500 py-12 text-sm">
                {pl.trainerChat.noMessages}
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
                      className={`flex ${message.sender === 'expert' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'client' && (
                        <div className="w-7 h-7 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                          <User className="w-3.5 h-3.5 text-neutral-500" />
                        </div>
                      )}
                      <div
                        className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl ${
                          message.sender === 'expert'
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${message.sender === 'expert' ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${message.sender === 'expert' ? 'text-emerald-100' : 'text-neutral-400'}`}>
                            {formatTime(message.created_at)}
                          </span>
                          {message.sender === 'expert' && (
                            message.read_at ? (
                              <CheckCheck className="w-3 h-3 text-emerald-200" />
                            ) : (
                              <Check className="w-3 h-3 text-emerald-300" />
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

        <div className="bg-white border-t border-neutral-200 safe-bottom">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={pl.trainerChat.replyingAs(expert?.name || 'trainer')}
              className="flex-1 px-4 py-2.5 bg-neutral-100 border border-transparent rounded-xl focus:outline-none focus:border-emerald-300 focus:bg-white transition-colors text-sm"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{pl.trainerChat.send}</span>
            </button>
          </form>
        </div>
      </div>

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
