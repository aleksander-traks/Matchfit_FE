import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { pl } from '../lib/i18n/pl';
import {
  Users,
  Search,
  ChevronRight,
  MapPin,
  Target,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowUpDown,
  User,
  Calendar,
  Dumbbell,
  Star,
  Award,
  Activity,
  Phone,
} from 'lucide-react';

interface AdminProfile {
  id: string;
  age: number | null;
  gender: string | null;
  living_area: string[] | null;
  goals: string[] | null;
  monthly_budget: string[] | null;
  training_experience: string | null;
  sessions_per_week: string | null;
  email: string | null;
  created_at: string;
  selected_expert_id: number | null;
  match_count: number;
}

interface AdminExpert {
  id: number;
  name: string;
  image: string | null;
  specialization: string;
  years_of_experience: number | null;
  monthly_budget: string | null;
  availability: string | null;
  cooperation: string | null;
  client_ratings: number | null;
  client_reviews: number | null;
  selected_count: number;
  matched_count: number;
  intro_call_count: number;
}

type UserSortField = 'created_at' | 'age' | 'match_count';
type TrainerSortField = 'name' | 'selected_count' | 'matched_count' | 'years_of_experience';
type SortDir = 'asc' | 'desc';

function SortHeader({
  label,
  field,
  current,
  dir,
  onToggle,
  className = '',
}: {
  label: string;
  field: string;
  current: string;
  dir: SortDir;
  onToggle: (f: string) => void;
  className?: string;
}) {
  const active = current === field;
  return (
    <th
      className={`text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide cursor-pointer select-none ${className}`}
      onClick={() => onToggle(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 transition-opacity ${active ? 'opacity-100 text-emerald-600' : 'opacity-40'}`} />
      </span>
    </th>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'users' | 'trainers'>('users');

  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<AdminProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileSearch, setProfileSearch] = useState('');
  const [profileSortField, setProfileSortField] = useState<UserSortField>('created_at');
  const [profileSortDir, setProfileSortDir] = useState<SortDir>('desc');
  const [filterTrainer, setFilterTrainer] = useState<'all' | 'yes' | 'no'>('all');

  const [experts, setExperts] = useState<AdminExpert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<AdminExpert[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [expertSearch, setExpertSearch] = useState('');
  const [expertSortField, setExpertSortField] = useState<TrainerSortField>('selected_count');
  const [expertSortDir, setExpertSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    api
      .getAllClientProfiles()
      .then((data) => setProfiles(data as AdminProfile[]))
      .catch(console.error)
      .finally(() => setProfilesLoading(false));

    api
      .getAllExperts()
      .then((data) => setExperts(data as AdminExpert[]))
      .catch(console.error)
      .finally(() => setExpertsLoading(false));
  }, []);

  useEffect(() => {
    let result = [...profiles];

    if (profileSearch.trim()) {
      const q = profileSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          (p.email ?? '').toLowerCase().includes(q) ||
          (p.gender ?? '').toLowerCase().includes(q) ||
          (p.living_area ?? []).some((a) => a.toLowerCase().includes(q)) ||
          (p.goals ?? []).some((g) => g.toLowerCase().includes(q))
      );
    }

    if (filterTrainer === 'yes') result = result.filter((p) => p.selected_expert_id !== null);
    else if (filterTrainer === 'no') result = result.filter((p) => p.selected_expert_id === null);

    result.sort((a, b) => {
      let av: number | string = profileSortField === 'created_at' ? a.created_at : profileSortField === 'age' ? (a.age ?? 0) : a.match_count;
      let bv: number | string = profileSortField === 'created_at' ? b.created_at : profileSortField === 'age' ? (b.age ?? 0) : b.match_count;
      if (av < bv) return profileSortDir === 'asc' ? -1 : 1;
      if (av > bv) return profileSortDir === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProfiles(result);
  }, [profiles, profileSearch, profileSortField, profileSortDir, filterTrainer]);

  useEffect(() => {
    let result = [...experts];

    if (expertSearch.trim()) {
      const q = expertSearch.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.specialization ?? '').toLowerCase().includes(q) ||
          (e.cooperation ?? '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const av = expertSortField === 'name' ? a.name : expertSortField === 'years_of_experience' ? (a.years_of_experience ?? 0) : expertSortField === 'matched_count' ? a.matched_count : a.selected_count;
      const bv = expertSortField === 'name' ? b.name : expertSortField === 'years_of_experience' ? (b.years_of_experience ?? 0) : expertSortField === 'matched_count' ? b.matched_count : b.selected_count;
      if (av < bv) return expertSortDir === 'asc' ? -1 : 1;
      if (av > bv) return expertSortDir === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredExperts(result);
  }, [experts, expertSearch, expertSortField, expertSortDir]);

  const toggleProfileSort = (field: string) => {
    if (profileSortField === field) setProfileSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setProfileSortField(field as UserSortField); setProfileSortDir('desc'); }
  };

  const toggleExpertSort = (field: string) => {
    if (expertSortField === field) setExpertSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setExpertSortField(field as TrainerSortField); setExpertSortDir('desc'); }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' });

  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  const isLoading = tab === 'users' ? profilesLoading : expertsLoading;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-neutral-900">{pl.admin.title}</h1>
                <p className="text-xs text-neutral-500">{pl.admin.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full font-medium">
                {profiles.length} {pl.admin.usersLabel}
              </span>
              <span className="text-xs text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full font-medium">
                {experts.length} {pl.admin.trainersLabel}
              </span>
            </div>
          </div>

          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setTab('users')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'users'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Users className="w-4 h-4" />
              {pl.admin.users}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === 'users' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                {profiles.length}
              </span>
            </button>
            <button
              onClick={() => setTab('trainers')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'trainers'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              {pl.admin.trainers}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === 'trainers' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                {experts.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">{pl.admin.loadingTab(tab === 'users' ? pl.admin.usersLabel : pl.admin.trainersLabel)}</p>
            </div>
          </div>
        ) : tab === 'users' ? (
          <>
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={pl.admin.searchUsers}
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-neutral-400"
                />
              </div>
              <select
                value={filterTrainer}
                onChange={(e) => setFilterTrainer(e.target.value as 'all' | 'yes' | 'no')}
                className="text-sm border border-neutral-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-700"
              >
                <option value="all">{pl.admin.allUsers}</option>
                <option value="yes">{pl.admin.hasTrainer}</option>
                <option value="no">{pl.admin.noTrainer}</option>
              </select>
            </div>

            {filteredProfiles.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
                <User className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-medium">{pl.admin.noUsersFound}</p>
                <p className="text-neutral-400 text-sm mt-1">{pl.admin.noUsersHint}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">{pl.admin.colUser}</th>
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">{pl.admin.colLocation}</th>
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">{pl.admin.colGoals}</th>
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden lg:table-cell">{pl.admin.colBudget}</th>
                        <SortHeader label={pl.admin.colMatches} field="match_count" current={profileSortField} dir={profileSortDir} onToggle={toggleProfileSort} className="hidden md:table-cell" />
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden sm:table-cell">{pl.admin.colTrainer}</th>
                        <SortHeader label={pl.admin.colJoined} field="created_at" current={profileSortField} dir={profileSortDir} onToggle={toggleProfileSort} />
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {filteredProfiles.map((profile) => (
                        <tr
                          key={profile.id}
                          onClick={() => navigate(`/admin/${profile.id}`)}
                          className="hover:bg-neutral-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-mono text-xs font-semibold text-neutral-700 tracking-wide">#{shortId(profile.id)}</p>
                                {profile.email ? (
                                  <p className="text-xs text-neutral-400 mt-0.5 max-w-[140px] truncate">{profile.email}</p>
                                ) : (
                                  <p className="text-xs text-neutral-300 mt-0.5">{pl.admin.noEmail}</p>
                                )}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {profile.age && <span className="text-xs text-neutral-500">{profile.age}y</span>}
                                  {profile.gender && <span className="text-xs text-neutral-400">{profile.gender}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {profile.living_area?.length ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span className="text-neutral-700 text-xs">
                                  {profile.living_area.slice(0, 2).join(', ')}
                                  {profile.living_area.length > 2 && <span className="text-neutral-400"> +{profile.living_area.length - 2}</span>}
                                </span>
                              </div>
                            ) : <span className="text-neutral-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            {profile.goals?.length ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {profile.goals.slice(0, 2).map((g) => (
                                  <span key={g} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100">
                                    <Target className="w-2.5 h-2.5" />{g}
                                  </span>
                                ))}
                                {profile.goals.length > 2 && <span className="text-xs text-neutral-400 px-1.5 py-0.5">+{profile.goals.length - 2}</span>}
                              </div>
                            ) : <span className="text-neutral-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            {profile.monthly_budget?.length ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-neutral-400" />
                                <span className="text-neutral-600 text-xs">
                                  {profile.monthly_budget[0]}
                                  {profile.monthly_budget.length > 1 && <span className="text-neutral-400"> +{profile.monthly_budget.length - 1}</span>}
                                </span>
                              </div>
                            ) : <span className="text-neutral-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600">
                              <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-500">{profile.match_count}</span>
                              {profile.match_count === 1 ? pl.admin.match : pl.admin.matches}
                            </span>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            {profile.selected_expert_id !== null ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                <CheckCircle className="w-3 h-3" />{pl.admin.statusSelected}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                <Clock className="w-3 h-3" />{pl.admin.statusPending}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 text-neutral-400 text-xs">
                              <Calendar className="w-3 h-3" />{formatDate(profile.created_at)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
                  <p className="text-xs text-neutral-400">{pl.admin.showingOf(filteredProfiles.length, profiles.length)} {pl.admin.usersLabel}</p>
                  <p className="text-xs text-neutral-400">{profiles.filter((p) => p.selected_expert_id !== null).length} {pl.admin.withTrainerSelected}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={pl.admin.searchTrainers}
                  value={expertSearch}
                  onChange={(e) => setExpertSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-neutral-400"
                />
              </div>
            </div>

            {filteredExperts.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
                <Dumbbell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-medium">{pl.admin.noTrainersFound}</p>
                <p className="text-neutral-400 text-sm mt-1">{pl.admin.noTrainersHint}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <SortHeader label={pl.admin.trainers} field="name" current={expertSortField} dir={expertSortDir} onToggle={toggleExpertSort} />
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden lg:table-cell">{pl.admin.colSpecialization}</th>
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden md:table-cell">{pl.admin.colFormat}</th>
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden md:table-cell">{pl.admin.colBudget}</th>
                        <SortHeader label={pl.admin.colExperience} field="years_of_experience" current={expertSortField} dir={expertSortDir} onToggle={toggleExpertSort} className="hidden sm:table-cell" />
                        <SortHeader label={pl.admin.colMatches} field="matched_count" current={expertSortField} dir={expertSortDir} onToggle={toggleExpertSort} />
                        <SortHeader label={pl.admin.colSelected} field="selected_count" current={expertSortField} dir={expertSortDir} onToggle={toggleExpertSort} />
                        <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden sm:table-cell">{pl.admin.colIntroCalls}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {filteredExperts.map((expert) => (
                        <tr key={expert.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {expert.image ? (
                                  <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Dumbbell className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-neutral-800 text-sm">{expert.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {expert.client_ratings !== null && (
                                    <span className="text-xs text-neutral-400 flex items-center gap-0.5">
                                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                      {expert.client_ratings}
                                    </span>
                                  )}
                                  {expert.client_reviews !== null && (
                                    <span className="text-xs text-neutral-400">{expert.client_reviews} {pl.admin.reviews}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            <p className="text-xs text-neutral-600 max-w-[200px] leading-relaxed">{expert.specialization || '—'}</p>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            {expert.cooperation ? (
                              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                                expert.cooperation === 'Online'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : expert.cooperation === 'On site'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                              }`}>
                                {expert.cooperation}
                              </span>
                            ) : <span className="text-neutral-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <span className="text-xs text-neutral-600">{expert.monthly_budget || '—'}</span>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            {expert.years_of_experience !== null ? (
                              <span className="text-xs text-neutral-600 flex items-center gap-1">
                                <Award className="w-3 h-3 text-neutral-400" />
                                {expert.years_of_experience}y
                              </span>
                            ) : <span className="text-neutral-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              expert.matched_count > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              {expert.matched_count}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              expert.selected_count > 0
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              {expert.selected_count}
                            </span>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              expert.intro_call_count > 0 ? 'text-blue-700' : 'text-neutral-400'
                            }`}>
                              <Phone className="w-3 h-3" />
                              {expert.intro_call_count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
                  <p className="text-xs text-neutral-400">{pl.admin.showingOf(filteredExperts.length, experts.length)} {pl.admin.trainersLabel}</p>
                  <p className="text-xs text-neutral-400">
                    {experts.filter(e => e.selected_count > 0).length} {pl.admin.trainersSelectedByUsers}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
