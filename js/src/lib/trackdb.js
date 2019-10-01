const getDB = () => {
  return new Promise((resolve, reject) => {
    const dbOpenReq = indexedDB.open('trackDB', 1);
    dbOpenReq.onerror = evt => {
      console.error("error opening db: %o", evt);
      reject(evt);
    };
    dbOpenReq.onupgradeneeded = evt => {
      console.debug("creating database");
      const db = evt.target.result;
      db.onerror = errevt => {
        console.error("error creating db: %o", errevt);
        reject(errevt);
      };
      const objectStore = db.createObjectStore("tracks", { keyPath: "persistent_id" });
      objectStore.createIndex("name", "name", { unique: false });
      objectStore.createIndex("artist", "artist", { unique: false });
      objectStore.createIndex("album", "album", { unique: false });
      objectStore.createIndex("date_modified", "date_modified", { unique: false });
      console.debug("database created");
    };
    dbOpenReq.onsuccess = evt => {
      console.debug("database opened");
      resolve(dbOpenReq.result);
    };
  });
};

export const trackDB = {
  db: getDB(),
  clear() {
    return this.db.then(db => {
      return new Promise(resolve => {
        const objectStore = db.transaction("tracks", "readwrite").objectStore("tracks");
        const req = objectStore.clear();
        req.onsuccess = evt => {
          resolve();
        };
      });
    });
  },
  getNewest() {
    return this.db.then(db => {
      return new Promise(resolve => {
        const objectStore = db.transaction("tracks").objectStore("tracks");
        const index = objectStore.index("date_modified");
        const curReq = index.openCursor(null, "prev");
        curReq.onsuccess = evt => {
          const cur = evt.target.result;
          if (cur) {
            resolve(cur.value.date_modified);
          } else {
            resolve(0);
          }
        };
      });
    });
  },
  countTracks() {
    return this.db.then(db => {
      return new Promise(resolve => {
        const objectStore = db.transaction("tracks").objectStore("tracks");
        objectStore.count().onsuccess = evt => resolve(evt.target.result);
      });
    });
  },
  loadTracks(batchCount, progressCallback) {
    return this.db.then(db => {
      return new Promise(resolve => {
        const objectStore = db.transaction("tracks").objectStore("tracks");
        const index = objectStore.index("date_modified");
        const tracks = [];
        const curReq = index.openCursor();
        curReq.onsuccess = evt => {
          const cur = evt.target.result;
          if (cur) {
            tracks.push(cur.value);
            if (progressCallback && tracks.length % batchCount === 0) {
              progressCallback(tracks);
            }
            /*
            if (tracks.length === 1000) {
              resolve(tracks);
            } else {
              cur.continue();
            }
            */
            cur.continue();
          } else {
            resolve(tracks);
          }
        };
      });
    });
  },
  updateTracks(tracks) {
    return this.db.then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("tracks", "readwrite");
        transaction.onerror = evt => {
          console.error("error committing transaction: %o", evt);
          reject(evt);
        };
        transaction.oncomplete = evt => {
          //console.debug("transaction success: %o", evt);
          resolve();
        };
        const objectStore = transaction.objectStore("tracks");
        const updateOne = index => {
          const req = objectStore.put(tracks[index]);
          req.onerror = evt => {
            console.error("error updating track %o: %o", tracks[index], evt);
          };
          req.onsuccess = evt => {
            //console.debug("updated track %o: %o", tracks[index], evt);
            if (index + 1 < tracks.length) {
              updateOne(index+ + 1);
            }
          };
        };
        updateOne(0);
      });
    });
  },
};

