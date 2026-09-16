import { useMemo, useState } from 'react';

type Props = {
  imagePath?: string;
  alt: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
};

const SUPABASE_PUBLIC =
  'https://wgtfhfbqnecwdrstxfwd.supabase.co';

function buildCandidates(
  imagePath?: string
) {
  if (!imagePath) {
    return [];
  }

  const raw =
    imagePath.trim();

  if (!raw) {
    return [];
  }

  const candidates: string[] = [];

  const add = (value?: string) => {
    if (
      value &&
      !candidates.includes(value)
    ) {
      candidates.push(value);
    }
  };

  add(raw);

  if (
    raw.includes(
      '/storage/v1/object/sign/'
    )
  ) {
    add(
      raw.replace(
        '/storage/v1/object/sign/',
        '/storage/v1/object/public/'
      ).split('?')[0]
    );
  }

  if (!/^https?:\/\//i.test(raw)) {
    const normalized =
      raw
        .replace(/^\/+/, '')
        .replace(
          /^uploads\/spielerbilder\//i,
          ''
        )
        .replace(
          /^spielerbilder\//i,
          ''
        );

    const fileName =
      normalized
        .split('/')
        .filter(Boolean)
        .pop() ?? normalized;

    add(
      `${SUPABASE_PUBLIC}/storage/v1/object/public/spielerbilder/${normalized}`
    );

    add(
      `${SUPABASE_PUBLIC}/storage/v1/object/public/spielerbilder/${fileName}`
    );

    add(
      `${SUPABASE_PUBLIC}/storage/v1/object/public/player-images/${normalized}`
    );

    add(
      `${SUPABASE_PUBLIC}/storage/v1/object/public/player-images/${fileName}`
    );

    add(
      `${SUPABASE_PUBLIC}/storage/v1/object/public/uploads/spielerbilder/${normalized}`
    );
  }

  return candidates;
}

export default function PlayerImage({
  imagePath,
  alt,
  style,
  fallback
}: Props) {
  const candidates =
    useMemo(
      () =>
        buildCandidates(
          imagePath
        ),
      [imagePath]
    );

  const [index, setIndex] =
    useState(0);

  if (
    candidates.length === 0 ||
    index >= candidates.length
  ) {
    return (
      <>
        {fallback ?? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#777'
            }}
          >
            Kein Bild
          </div>
        )}
      </>
    );
  }

  return (
    <img
      src={candidates[index]}
      alt={alt}
      style={style}
      onError={() =>
        setIndex(
          current =>
            current + 1
        )
      }
    />
  );
}
