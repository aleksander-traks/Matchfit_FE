interface BenefitLogoProps {
  benefit: string;
  size?: 'sm' | 'md';
}

function MedicoverSportLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 28 : 36;
  const w = h;
  return (
    <svg width={w} height={h} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '22%' }}>
      <rect width="100" height="100" rx="22" fill="#00AFEF" />
      <g transform="translate(50,38)" fill="white">
        <circle cx="0" cy="-18" r="7" />
        <path d="M-28,0 Q-14,-22 0,-10 Q14,-22 28,0 Q14,8 0,18 Q-14,8 -28,0Z" />
        <path d="M-22,-8 Q-28,-24 0,-32 Q28,-24 22,-8" fill="none" stroke="white" strokeWidth="5" />
      </g>
      <text x="50" y="72" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="0.5">MEDICOVER</text>
      <text x="50" y="83" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="0.5">SPORT</text>
    </svg>
  );
}

function MultisportLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 20 : 26;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: h }}>
      <svg width={h} height={h} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" stroke="#3A4BC6" strokeWidth="8" fill="none" />
        <rect x="43" y="22" width="14" height="56" rx="7" fill="#3A4BC6" />
      </svg>
      <span style={{
        fontWeight: 800,
        fontStyle: 'italic',
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: size === 'sm' ? 13 : 16,
        color: '#111',
        letterSpacing: '-0.3px',
        lineHeight: 1,
      }}>
        MultiSport
      </span>
    </div>
  );
}

export function BenefitLogo({ benefit, size = 'md' }: BenefitLogoProps) {
  const normalized = benefit.toLowerCase().replace(/\s+/g, '');

  if (normalized === 'medicoversport') {
    return (
      <span className="inline-flex items-center" title="Medicover Sport">
        <MedicoverSportLogo size={size} />
      </span>
    );
  }

  if (normalized === 'multisport') {
    return (
      <span className="inline-flex items-center" title="Multisport">
        <MultisportLogo size={size} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {benefit}
    </span>
  );
}

interface BenefitLogosRowProps {
  benefits: string[];
  size?: 'sm' | 'md';
}

export function BenefitLogosRow({ benefits, size = 'md' }: BenefitLogosRowProps) {
  if (!benefits || benefits.length === 0) return null;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {benefits.map((benefit) => (
        <BenefitLogo key={benefit} benefit={benefit} size={size} />
      ))}
    </div>
  );
}
