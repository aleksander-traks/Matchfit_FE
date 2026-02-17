import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import {
  ArrowLeft,
  User,
  Target,
  Dumbbell,
  Heart,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  Mail,
  Award,
  MessageSquare,
  Phone,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';

interface AdminUserDetail {
  profile: any;
  matches: any[];
  selectedTrainer: any | null;
  introCalls: any[];
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-emerald-600">{icon}</div>
        <h3 className="font-semibold text-neutral-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Tag({ children, color = 'neutral' }: { children: React.ReactNode; color?: 'neutral' | 'emerald' | 'amber' | 'red' | 'blue' }) {
  const styles = {
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return (
    <span className={`inline-block px-2.5 py-1 text-xs rounded-full border font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-neutral-50 last:border-0">
      <span className="text-sm text-neutral-500 shrink-0 w-36">{label}</span>
      <div className="text-sm text-neutral-800 text-right">{value || <span className="text-neutral-300">—</span>}</div>
    </div>
  );
}

export default function AdminUserDetail() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    api
      .getAdminUserDetail(profileId)
      .then((data) => setDetail(data as AdminUserDetail))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [profileId]);

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600 font-medium">User not found</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 text-sm text-emerald-600 hover:underline"
          >
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  const { profile, matches, selectedTrainer, introCalls } = detail;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            All Users
          </button>
          <div className="w-px h-5 bg-neutral-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="font-mono text-sm font-semibold text-neutral-700 tracking-wide">
              #{profile.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {selectedTrainer ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <CheckCircle className="w-3 h-3" />
                Trainer selected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                <Clock className="w-3 h-3" />
                No trainer yet
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Joined', value: formatDate(profile.created_at), icon: <Calendar className="w-4 h-4" /> },
            { label: 'Matches', value: matches.length.toString(), icon: <Zap className="w-4 h-4" /> },
            { label: 'Intro Calls', value: introCalls.length.toString(), icon: <Phone className="w-4 h-4" /> },
            { label: 'Messages', value: profile.email ? 'Has email' : 'No email', icon: <Mail className="w-4 h-4" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-2 text-neutral-400 mb-2">{icon}<span className="text-xs">{label}</span></div>
              <p className="text-lg font-semibold text-neutral-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Section icon={<User className="w-4 h-4" />} title="Demographics">
            <InfoRow label="Age" value={profile.age ? `${profile.age} years old` : null} />
            <InfoRow label="Gender" value={profile.gender} />
            <InfoRow
              label="Location"
              value={
                profile.living_area?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(profile.living_area as string[]).map((a) => (
                      <Tag key={a}><span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{a}</span></Tag>
                    ))}
                  </div>
                ) : null
              }
            />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Email consent" value={profile.email_consent ? 'Yes' : 'No'} />
            <InfoRow
              label="Budget"
              value={
                profile.monthly_budget?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(profile.monthly_budget as string[]).map((b) => (
                      <Tag key={b} color="blue"><span className="flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />{b}</span></Tag>
                    ))}
                  </div>
                ) : null
              }
            />
          </Section>

          <Section icon={<Dumbbell className="w-4 h-4" />} title="Training Profile">
            <InfoRow label="Experience" value={profile.training_experience} />
            <InfoRow label="Sessions/week" value={profile.sessions_per_week} />
            <InfoRow label="Weight goal" value={profile.weight_goal} />
            <InfoRow
              label="Availability"
              value={
                profile.availability?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(profile.availability as string[]).map((d) => (
                      <Tag key={d} color="emerald">{d}</Tag>
                    ))}
                  </div>
                ) : null
              }
            />
            <InfoRow
              label="Format"
              value={
                profile.cooperation?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(profile.cooperation as string[]).map((c) => (
                      <Tag key={c} color="neutral">{c}</Tag>
                    ))}
                  </div>
                ) : null
              }
            />
          </Section>
        </div>

        <Section icon={<Target className="w-4 h-4" />} title="Goals">
          {profile.goals?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(profile.goals as string[]).map((g) => (
                <Tag key={g} color="emerald">
                  <span className="flex items-center gap-1"><Target className="w-2.5 h-2.5" />{g}</span>
                </Tag>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No goals recorded</p>
          )}
        </Section>

        <Section icon={<Heart className="w-4 h-4" />} title="Health">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Chronic Conditions</p>
              {profile.chronic_diseases?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(profile.chronic_diseases as string[]).map((d) => (
                    <Tag key={d} color="red">{d}</Tag>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">None reported</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Injuries</p>
              {profile.injuries?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(profile.injuries as string[]).map((i) => (
                    <Tag key={i} color="amber">{i}</Tag>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">None reported</p>
              )}
            </div>
          </div>
        </Section>

        {profile.overview && (
          <Section icon={<FileText className="w-4 h-4" />} title="AI-Generated Overview">
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {profile.overview}
            </p>
          </Section>
        )}

        {selectedTrainer && (
          <Section icon={<CheckCircle className="w-4 h-4" />} title="Selected Trainer">
            <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                {selectedTrainer.expert?.image ? (
                  <img
                    src={selectedTrainer.expert.image}
                    alt={selectedTrainer.expert.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-neutral-800">{selectedTrainer.expert?.name || 'Unknown Trainer'}</p>
                {selectedTrainer.expert?.specialization && (
                  <p className="text-sm text-neutral-500 mt-0.5">{selectedTrainer.expert.specialization}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {selectedTrainer.expert?.years_of_experience && (
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {selectedTrainer.expert.years_of_experience} years exp.
                    </span>
                  )}
                  {selectedTrainer.expert?.client_ratings && (
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {selectedTrainer.expert.client_ratings} rating
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400">Selected</p>
                <p className="text-xs text-neutral-500 mt-0.5">{formatDate(selectedTrainer.selected_at)}</p>
              </div>
            </div>
          </Section>
        )}

        {matches.length > 0 && (
          <Section icon={<Activity className="w-4 h-4" />} title={`Match Results (${matches.length})`}>
            <div className="space-y-3">
              {matches.map((match, idx) => (
                <div
                  key={match.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    selectedTrainer?.expert_id === match.expert_id
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-neutral-50 border-neutral-100'
                  }`}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-neutral-200 text-xs font-bold text-neutral-500 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-neutral-800 text-sm">
                        {match.expert?.name || `Expert #${match.expert_id}`}
                      </p>
                      {selectedTrainer?.expert_id === match.expert_id && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    {match.expert?.specialization && (
                      <p className="text-xs text-neutral-500 mt-0.5">{match.expert.specialization}</p>
                    )}
                    {(match.reason_1 || match.reason1) && (
                      <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                        {match.reason_1 || match.reason1}
                      </p>
                    )}
                    {(match.reason_2 || match.reason2) && (
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        {match.reason_2 || match.reason2}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-neutral-700">
                        {typeof match.match_score === 'number'
                          ? match.match_score.toFixed(1)
                          : match.match_score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {introCalls.length > 0 && (
          <Section icon={<Phone className="w-4 h-4" />} title={`Intro Calls (${introCalls.length})`}>
            <div className="space-y-3">
              {introCalls.map((call) => (
                <div key={call.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-neutral-800 text-sm">
                        {call.expert?.name || `Expert #${call.expert_id}`}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{call.email}</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        call.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : call.status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : call.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {call.preferred_date && (
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(call.preferred_date)}
                      </span>
                    )}
                    {call.preferred_time && (
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {call.preferred_time}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Requested {formatDateTime(call.created_at)}
                    </span>
                  </div>
                  {call.notes && (
                    <p className="text-xs text-neutral-600 mt-2 italic">"{call.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="pb-8" />
      </main>
    </div>
  );
}
