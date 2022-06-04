import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';

export const Artwork = ({
  track,
  onChange,
}) => {
  const fileInput = useRef();
  const onSetImage = useCallback(evt => {
    const fr = new FileReader();
    fr.onload = revt => {
      onChange({ artwork_url: revt.target.result });
    };
    fr.readAsDataURL(evt.target.files[0]);
  }, [onChange]);
  useEffect(() => {
    const listener = evt => {
      if (evt.clipboardData.items.length > 0) {
        const f = evt.clipboardData.items[0].getAsFile();
        if (f && f.type.startsWith('image/')) {
          const fr = new FileReader();
          fr.onload = revt => {
            onChange({ artwork_url: revt.target.result });
          };
          fr.readAsDataURL(f);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('paste', listener, true);
      return () => {
        window.removeEventListener('paste', listener, true);
      };
    }
  }, [onChange]);
  const url = useMemo(() => {
    if (track.artwork_url) {
      return track.artwork_url;
    }
    if (track.persistent_id) {
      return `/api/art/track/${track.persistent_id}`;
    }
    if (track.sort_album && (track.sort_artist || track.sort_album_artist)) {
      return `/api/art/album?artist=${track.sort_album_artist || track.sort_artist}&album=${track.sort_album}`;
    }
    return '/nocover.jpg';
  }, [track]);

  const onClick = useCallback((evt) => {
    if (fileInput.current) {
      fileInput.current.click();
    }
  }, []);

  return (
    <div className="artwork">
      Album Artwork
      <div className="cover">
        <img src={url} alt="Cover" onClick={onClick} />
      </div>
      <input ref={fileInput} type="file" accept=".jpg,.png,image/png,image/jpg" onChange={onSetImage} />
      <style jsx>{`
        .artwork {
          font-size: 14px;
          font-weight: bold;
        }
        .artwork .cover {
          margin-top: 1em;
          width: 500px;
          height: 300px;
          line-height: 300px;
          text-align: center;
        }
        .artwork .cover img {
          max-width: 300px;
          max-height: 300px;
        }
        .artwork input[type="file"] {
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
};

Artwork.displayName = 'Artwork';
