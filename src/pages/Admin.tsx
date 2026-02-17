import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Users,
  Search,
  ChevronRight,
  MapPin,
  Target,
  DollarSign,
  CheckCircle,
  Clock,
  Filter,
  ArrowUpDown,
  User,
  Calendar,
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

type SortField = 'created_at' | 'age' | 'match_count';
type SortDir = 'asc' | 'desc';

export default function Admin() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [filtered, setFiltered] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterTrainer, setFilterTrainer] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    api
      .getAllClientProfiles()
      .then((data) => {
        setProfiles(data as AdminProfile[]);
        setFiltered(data as AdminProfile[]);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    let result = [...profiles];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          (p.email ?? '').toLowerCase().includes(q) ||
          (p.gender ?? '').toLowerCase().includes(q) ||
          (p.living_area ?? []).some((a) => a.toLowerCase().includes(q)) ||
          (p.goals ?? []).some((g) => g.toLowerCase().includes(q))
      );
    }

    if (filterTrainer === 'yes') {
      result = result.filter((p) => p.selected_expert_id !== null);
    } else if (filterTrainer === 'no') {
      result = result.filter((p) => p.selected_expert_id === null);
    }

    result.sort((a, b) => {
      let av: number | string;
      let bv: number | string;

      if (sortField === 'created_at') {
        av = a.created_at;
        bv = b.created_at;
      } else if (sortField === 'age') {
        av = a.age ?? 0;
        bv = b.age ?? 0;
      } else {
        av = a.match_count;
        bv = b.match_count;
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(result);
  }, [profiles, search, sortField, sortDir, filterTrainer]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-neutral-900">Admin Panel</h1>
              <p className="text-xs text-neutral-500">User Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full font-medium">
              {profiles.length} total users
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by ID, email, location, goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-neutral-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
            <select
              value={filterTrainer}
              onChange={(e) => setFilterTrainer(e.target.value as 'all' | 'yes' | 'no')}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-700"
            >
              <option value="all">All users</option>
              <option value="yes">Has trainer</option>
              <option value="no">No trainer</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
            <User className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">No users found</p>
            <p className="text-neutral-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">
                      Location
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">
                      Goals
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden lg:table-cell">
                      Budget
                    </th>
                    <th
                      className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide cursor-pointer select-none hidden md:table-cell"
                      onClick={() => toggleSort('match_count')}
                    >
                      <span className="flex items-center gap-1">
                        Matches
                        <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden sm:table-cell">
                      Trainer
                    </th>
                    <th
                      className="text-left px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide cursor-pointer select-none"
                      onClick={() => toggleSort('created_at')}
                    >
                      <span className="flex items-center gap-1">
                        Joined
                        <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map((profile) => (
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
                            <p className="font-mono text-xs font-semibold text-neutral-700 tracking-wide">
                              #{shortId(profile.id)}
                            </p>
                            {profile.email ? (
                              <p className="text-xs text-neutral-400 mt-0.5 max-w-[140px] truncate">
                                {profile.email}
                              </p>
                            ) : (
                              <p className="text-xs text-neutral-300 mt-0.5">No email</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {profile.age && (
                                <span className="text-xs text-neutral-500">{profile.age}y</span>
                              )}
                              {profile.gender && (
                                <span className="text-xs text-neutral-400">{profile.gender}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {profile.living_area && profile.living_area.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="text-neutral-700 text-xs">
                              {profile.living_area.slice(0, 2).join(', ')}
                              {profile.living_area.length > 2 && (
                                <span className="text-neutral-400">
                                  {' '}+{profile.living_area.length - 2}
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {profile.goals && profile.goals.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {profile.goals.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100"
                              >
                                <Target className="w-2.5 h-2.5" />
                                {g}
                              </span>
                            ))}
                            {profile.goals.length > 2 && (
                              <span className="text-xs text-neutral-400 px-1.5 py-0.5">
                                +{profile.goals.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {profile.monthly_budget && profile.monthly_budget.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-neutral-400" />
                            <span className="text-neutral-600 text-xs">
                              {profile.monthly_budget[0]}
                              {profile.monthly_budget.length > 1 && (
                                <span className="text-neutral-400"> +{profile.monthly_budget.length - 1}</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600">
                          <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-500">
                            {profile.match_count}
                          </span>
                          {profile.match_count === 1 ? 'match' : 'matches'}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {profile.selected_expert_id !== null ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                            <CheckCircle className="w-3 h-3" />
                            Selected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-neutral-400 text-xs">
                          <Calendar className="w-3 h-3" />
                          {formatDate(profile.created_at)}
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
              <p className="text-xs text-neutral-400">
                Showing {filtered.length} of {profiles.length} users
              </p>
              <p className="text-xs text-neutral-400">
                {profiles.filter((p) => p.selected_expert_id !== null).length} with trainer selected
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
