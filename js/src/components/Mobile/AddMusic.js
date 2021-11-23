import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import _JSXStyle from 'styled-jsx/style';
import {
  BrowserRouter as Router,
  Route,
  useRouteMatch,
  generatePath,
} from 'react-router-dom';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { EditContext } from '../../context/EditContext';
import { Link } from './Link';

export const AddMusic = () => {
  const { params } = useRouteMatch();
  const [title, setTitle] = useState('');
  const [playlist, setPlaylist] = useState({});
  useEffect(() => {
    api.loadPlaylist(params.playlistId).then(setPlaylist);
  }, [params.playlistId]);
  const ctx = useMemo(() => ({ addTo: playlist }), [playlist]);
  return (
    <EditContext.Provider value={ctx}>
      <div className="sheet">
        <div className="header">
          <div className="title">Add Songs to "{playlist.name}"</div>
          <div className="nav">
            <div className="navback">
              <Back />
            </div>
            <div className="title">{title}</div>
            <div className="done">
              <Link to={`/playlists/${playlist.persistent_id}`}>Done</Link>
            </div>
          </div>
        </div>
        <div className="body">
          <Router>
            <Route exact path="/">
              <Home />
            </Route>
            <Route path="/playlists">
              <PlaylistContainer />
            </Route>
            <Route exact path="/artists">
              <ArtistList />
            </Route>
            <Route path="/artists/:artistName">
              <AlbumList />
            </Route>
            <Route exact path="/albums">
              <AlbumList />
            </Route>
            <Route exact path="/albums/:artistName/:albumName">
              <AlbumContainer />
            </Route>
            <Route exact path="/genres">
              <GenreList />
            </Route>
            <Route exact path="/genres/:genreName">
              <ArtistList />
            </Route>
            <Route exact path="/podcasts">
              <PodcastList />
            </Route>
            <Route exact path="/audiobooks">
              <AudiobookList />
            </Route>
            <Route exact path="/recents">
              <RecentAdditions />
            </Route>
            <Route exact path="/purchases">
              <Purchases />
            </Route>
            <Route path="/search">
              <Search />
            </Route>
          </Router>
        </div>
      </div>
    </EditContext.Provider>
  );
};

export default AddMusic;
