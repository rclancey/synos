import React, { useEffect, useContext, useState, useCallback } from 'react';
import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';

export const StackContext = React.createContext({
  pages: [],
  adding: false,
  setTitle: (title) => null,
  onPop: () => null,
  onPush: (title, content) => null,
  onScroll: ({ scollOffset }) => null,
  onBeginAdd: (playlist) => null,
  onAdd: (track) => null,
  onFinishAdd: () => null,
  onCancelAdd: () => null,
});

export const useStack = () => useContext(StackContext);

export const usePages = () => {
  const api = useAPI(API);
  const [pages, setPages] = useState([]);
  const [addingTo, setAddingTo] = useState(null);
  const onUpdate = useCallback((update) => {
    const page = pages[pages.length - 1];
    if (page) {
      if (!Object.entries(update).some(entry => {
        if (page[entry[0]] !== entry[1]) {
          return true;
        }
      })) {
        return;
      }
      //console.trace('update page %o => $o', page, update);
      const newPages = pages.slice(0, pages.length - 1);
      newPages.push(Object.assign({}, page, update));
      console.debug('setting pages (%o) %o => %o', update, pages, newPages);
      setPages(newPages);
    }
  }, [pages]);
  const setTitle = useCallback((title) => {
    onUpdate({ title });
  }, [onUpdate]);
  const onPop = useCallback(() => {
    if (pages.length > 0) {
      if (addingTo !== null && addingTo.stackIndex >= pages.length - 1) {
        api.addToPlaylist(addingTo.playlist, addingTo.tracks)
          .then(() => setAddingTo(null))
          .then(() => setPages(pages.slice(0, pages.length - 1)));
      } else {
        console.debug('popping pages %o', pages);
        setPages(pages.slice(0, pages.length - 1));
      }
    }
  }, [pages, addingTo, api]);
  useEffect(() => {
    console.debug('pages = %o', pages);
  }, [pages]);
  const onPush = useCallback((title, content) => {
    console.debug('pushing page %o onto %o', title, pages);
    setPages(pages.concat([{ title, content, scrollOffset: 0 }]));
  }, [pages]);
  const onScroll = useCallback(({ scrollOffset }) => onUpdate({ scrollOffset }), [onUpdate]);
  const onBeginAdd = useCallback((playlist, title, content) => {
    setAddingTo({
      stackIndex: pages.length,
      playlist: playlist,
      tracks: [],
    });
    console.debug('onBeginAdd pusing root page %o onto %o', title, pages);
    setPages(pages.concat([{ title, content, scrollOffset: 0 }]));
  }, [pages]);
  const onAdd = useCallback((track) => {
    const add = Object.assign({}, addingTo, { tracks: addingTo.tracks.concat([track]) });
    setAddingTo(add);
  }, [addingTo]);
  return {
    pages,
    setTitle,
    onPop,
    onPush,
    onScroll,
    onBeginAdd: addingTo === null ? onBeginAdd : null,
    onAdd: addingTo === null ? null : onAdd,
  };
};
