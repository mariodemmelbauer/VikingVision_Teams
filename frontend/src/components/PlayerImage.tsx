import { useEffect, useMemo, useState } from 'react';

type Props = {
  playerId?: number | string;
  imagePath?: string;
  accessToken?: string;
  apiBase?: string;
  alt: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
};

const SUPABASE_PUBLIC =
  'https://wgtfhfbqnecwdrstxfwd.supabase.co';

function buildCandidates(
  playerId?: number | string,
  imagePath?: string,
  accessToken?: string,
  apiBase?: string
) {
  const candidates: Array<{
    url: string;
    authenticated?: boolean;
  }> = [];

  const add = (
    url?: string,
    authenticated = false
  ) => {
    if (
      url &&
      !candidates.some(
        item =>
          item.url === url
      )
    ) {
      candidates.push({
        url,
        authenticated
      });
    }
  };

  // Preferred route: Worker reads/proxies the image with the
  // Supabase service key. This also works with private buckets.
  if (
    playerId != null &&
    accessToken &&
    apiBase
  ) {
    add(
      `${apiBase}/players/${playerId}/image`,
      true
    );
  }

  if (!imagePath) {
    return candidates;
  }

  const raw =
    imagePath.trim();

  if (!raw) {
    return candidates;
  }

  // Keep direct URL as a fallback.
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
        .replace(/\\/g, '/')
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
  }

  return candidates;
}

export default function PlayerImage({
  playerId,
  imagePath,
  accessToken,
  apiBase,
  alt,
  style,
  fallback
}: Props) {
  const candidates =
    useMemo(
      () =>
        buildCandidates(
          playerId,
          imagePath,
          accessToken,
          apiBase
        ),
      [
        playerId,
        imagePath,
        accessToken,
        apiBase
      ]
    );

  const [index, setIndex] =
    useState(0);

  const [blobUrl, setBlobUrl] =
    useState<string | null>(
      null
    );

  const current =
    candidates[index];

  useEffect(
    () => {
      setIndex(0);
    },
    [
      playerId,
      imagePath,
      accessToken,
      apiBase
    ]
  );

  useEffect(
    () => {
      let cancelled = false;
      let localBlobUrl:
        string | null = null;

      setBlobUrl(null);

      if (
        !current ||
        !current.authenticated ||
        !accessToken
      ) {
        return () => {};
      }

      fetch(
        current.url,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`
          }
        }
      )
        .then(async response => {
          if (!response.ok) {
            throw new Error(
              `Image HTTP ${response.status}`
            );
          }

          const blob =
            await response.blob();

          if (
            !blob.type.startsWith(
              'image/'
            )
          ) {
            throw new Error(
              'Response is not an image'
            );
          }

          localBlobUrl =
            URL.createObjectURL(
              blob
            );

          if (!cancelled) {
            setBlobUrl(
              localBlobUrl
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIndex(
              currentIndex =>
                currentIndex + 1
            );
          }
        });

      return () => {
        cancelled = true;

        if (localBlobUrl) {
          URL.revokeObjectURL(
            localBlobUrl
          );
        }
      };
    },
    [
      current?.url,
      current?.authenticated,
      accessToken
    ]
  );

  if (
    !current ||
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

  if (
    current.authenticated &&
    !blobUrl
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
            Bild wird geladen…
          </div>
        )}
      </>
    );
  }

  return (
    <img
      src={
        current.authenticated
          ? blobUrl ?? ''
          : current.url
      }
      alt={alt}
      style={style}
      onError={() =>
        setIndex(
          currentIndex =>
            currentIndex + 1
        )
      }
    />
  );
}
