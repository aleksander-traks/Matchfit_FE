import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { pl } from '../lib/i18n/pl';
import { MessageCircle, Clock, ChevronRight, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Conversation {
  clientProfileId: string;
  lastMessage: string;
  lastTime: string;
  lastSender: string;
  unreadCount: number;
  clientEmail: string | null;
  clientGoals: string[];
  clientTrainingExperience: string | null;
}

interface Expert {
  id: number;
  name: string;
  image?: string;
  specialization?: string;
}

export default function TrainerInbox() {
  const { expertId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [expert, setExpert] = useState<Expert | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!expertId) {
        setAuthError(true);
        setIsLoading(false);
        return;
      }

      let resolvedExpert: Expert | null = null;

      if (token) {
        resolvedExpert = await api.getExpertByToken(token);
        if (!resolvedExpert || resolvedExpert.id !== parseInt(expertId)) {
          setAuthError(true);
          setIsLoading(false);
          return;
        }
      } else {
        const { data } = await supabase
          .from('experts')
          .select('*')
          .eq('id', parseInt(expertId))
          .maybeSingle();
        resolvedExpert = data;
      }

      if (!resolvedExpert) {
        setAuthError(true);
        setIsLoading(false);
        return;
      }

      setExpert(resolvedExpert);

      const convs = await api.getExpertConversations(parseInt(expertId));
      setConversations(convs);
      setIsLoading(false);
    };

    init().catch(() => {
      setAuthError(true);
      setIsLoading(false);
    });
  }, [expertId, token]);

  useEffect(() => {
    if (!expertId) return;

    const channel = supabase
      .channel(`trainer-inbox-${expertId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `expert_id=eq.${expertId}`,
        },
        async () => {
          const convs = await api.getExpertConversations(parseInt(expertId));
          setConversations(convs);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [expertId]);

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return pl.trainerInbox.justNow;
    if (diffMins < 60) return pl.trainerInbox.minutesAgo(diffMins);
    if (diffHours < 24) return pl.trainerInbox.hoursAgo(diffHours);
    if (diffDays === 1) return pl.trainerInbox.yesterday;
    return then.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleOpenChat = (clientProfileId: string) => {
    const tokenParam = token ? `?token=${token}` : '';
    navigate(`/trainer/${expertId}/chat/${clientProfileId}${tokenParam}`);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">{pl.trainerInbox.loading}</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{pl.trainerInbox.accessDeniedTitle}</h2>
          <p className="text-neutral-600">
            {pl.trainerInbox.accessDeniedDesc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {expert?.image ? (
              <img
                src={expert.image}
                alt={expert.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-100"
              />
            ) : (
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-bold text-neutral-900">{expert?.name}</h1>
              <p className="text-sm text-neutral-500">{expert?.specialization || pl.trainerInbox.trainerInbox}</p>
            </div>
            {totalUnread > 0 && (
              <div className="bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                {pl.trainerInbox.newMessages(totalUnread)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">{pl.trainerInbox.noMessagesTitle}</h3>
            <p className="text-neutral-500 text-sm">
              {pl.trainerInbox.noMessagesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.clientProfileId}
                onClick={() => handleOpenChat(conv.clientProfileId)}
                className="w-full bg-white rounded-xl border border-neutral-200 p-4 text-left hover:border-emerald-300 hover:shadow-sm transition-all duration-150 group"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 bg-neutral-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-500" />
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${conv.unreadCount > 0 ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {conv.clientEmail || pl.trainerInbox.clientId(conv.clientProfileId.slice(0, 8))}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-neutral-400 flex-shrink-0 ml-2">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(conv.lastTime)}
                      </div>
                    </div>

                    {conv.clientGoals && conv.clientGoals.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-1">
                        {conv.clientGoals.slice(0, 2).map((goal: string) => (
                          <span key={goal} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            {goal}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}>
                      {conv.lastSender === 'expert' ? pl.trainerInbox.you : ''}{conv.lastMessage}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
