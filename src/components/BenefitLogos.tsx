interface BenefitLogoProps {
  benefit: string;
  size?: 'sm' | 'md';
}

function MedicoverSportLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 24 : 30;
  const fontSize = size === 'sm' ? 12 : 14.5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: '22%', flexShrink: 0 }}
      >
        <rect width="100" height="100" rx="22" fill="#00AFEF" />
        <circle cx="50" cy="24" r="9" fill="white" />
        <path d="M18 56 Q34 30 50 42 Q66 30 82 56 Q66 68 50 76 Q34 68 18 56Z" fill="white" />
        <path d="M24 44 Q50 18 76 44" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{
          fontWeight: 700,
          fontFamily: 'Arial, sans-serif',
          fontSize,
          color: '#0099d6',
          letterSpacing: '0px',
          whiteSpace: 'nowrap',
        }}>
          Medicover
        </span>
        <span style={{
          fontWeight: 700,
          fontFamily: 'Arial, sans-serif',
          fontSize,
          color: '#0099d6',
          letterSpacing: '0px',
          whiteSpace: 'nowrap',
        }}>
          Sport
        </span>
      </div>
    </div>
  );
}

function MultisportLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 20 : 26;
  const fontSize = size === 'sm' ? 13 : 16;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" stroke="#3A4BC6" strokeWidth="8" fill="none" />
        <rect x="43" y="22" width="14" height="56" rx="7" fill="#3A4BC6" />
      </svg>
      <span style={{
        fontWeight: 800,
        fontStyle: 'italic',
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize,
        color: '#111',
        letterSpacing: '-0.3px',
        lineHeight: 1,
        whiteSpace: 'nowrap',
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

  return null;
}

interface BenefitLogosRowProps {
  benefits: string[];
  size?: 'sm' | 'md';
}

export function BenefitLogosRow({ benefits, size = 'md' }: BenefitLogosRowProps) {
  if (!benefits || benefits.length === 0) return null;
  return (
    <div className="flex items-center gap-5 flex-wrap">
      {benefits.map((benefit) => (
        <BenefitLogo key={benefit} benefit={benefit} size={size} />
      ))}
    </div>
  );
}
