import type {
  CSSProperties,
  ReactNode
} from 'react';

type Props = {
  section?: string;
  title: string;
  description?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: ReactNode;
  meta?: ReactNode;
};

export default function PageHeader({
  section = 'SV Oberbank Ried',
  title,
  description,
  backLabel = 'Dashboard',
  onBack,
  actions,
  meta
}: Props) {
  return (
    <section
      className="vv-page-header"
      style={header}
    >
      <div
        className="vv-page-header-copy"
        style={copy}
      >
        <div style={sectionLabel}>
          {section}
        </div>

        <h1 style={titleStyle}>
          {title}
        </h1>

        {description && (
          <p style={descriptionStyle}>
            {description}
          </p>
        )}

        {meta && (
          <div
            className="vv-page-header-meta"
            style={metaStyle}
          >
            {meta}
          </div>
        )}
      </div>

      {(actions || onBack) && (
        <div
          className="vv-page-header-actions"
          style={actionsStyle}
        >
          {actions}

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={backButton}
            >
              ← {backLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '24px',
  padding: '22px 24px',
  borderRadius: '16px',
  background: '#fff',
  border: '1px solid #ececec',
  boxShadow:
    '0 5px 20px rgba(0,0,0,.04)'
};

const copy: CSSProperties = {
  minWidth: 0
};

const sectionLabel: CSSProperties = {
  color: '#0b7a3b',
  fontSize: '10px',
  fontWeight: 900,
  letterSpacing: '.11em',
  textTransform: 'uppercase'
};

const titleStyle: CSSProperties = {
  margin: '7px 0 5px',
  fontSize:
    'clamp(28px, 3.5vw, 38px)',
  lineHeight: 1.05,
  letterSpacing: '-.035em'
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: '720px',
  color: '#6f6f6f',
  fontSize: '13px',
  lineHeight: 1.5
};

const metaStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '11px',
  color: '#666',
  fontSize: '11px'
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  flexWrap: 'wrap'
};

const backButton: CSSProperties = {
  border: '1px solid #d7d7d7',
  background: '#fff',
  color: '#222',
  padding: '9px 12px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '12px'
};
