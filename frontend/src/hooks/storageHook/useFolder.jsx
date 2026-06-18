import { useReducer, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { database } from "../../config/firebase";
import {
  getDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const ACTIONS = {
  SELECT_FOLDER: "select-folder",
  UPDATE_FOLDER: "update-folder",
  SET_CHILD_FOLDERS: "set-child-folders",
  SET_CHILD_FILES: "set-child-files",
  TRIGGER_REFRESH: "trigger-refresh",
  SET_ALL_USER_FILES: "set-all-user-files",
  SET_ALL_USER_FOLDERS: "set-all-user-folders",
  SET_LOADING_ALL_FILES: "set-loading-all-files",
};

export const ROOT_FOLDER = {
  name: "Root",
  id: null,
  path: [],
};

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.TRIGGER_REFRESH:
      return {
        ...state,
        refresh: !state.refresh,
      };

    case ACTIONS.SELECT_FOLDER:
      return {
        ...state,
        folderId: payload.folderId,
        folder: payload.folder,
        childFiles: [],
        childFolders: [],
      };

    case ACTIONS.UPDATE_FOLDER:
      return {
        ...state,
        folder: payload.folder,
      };

    case ACTIONS.SET_CHILD_FOLDERS:
      return {
        ...state,
        childFolders: payload.childFolders,
      };

    case ACTIONS.SET_CHILD_FILES:
      return {
        ...state,
        childFiles: payload.childFiles,
      };

    case ACTIONS.SET_ALL_USER_FILES:
      return {
        ...state,
        allUserFiles: payload.allUserFiles,
      };

    case ACTIONS.SET_ALL_USER_FOLDERS:
      return {
        ...state,
        allUserFolders: payload.allUserFolders,
      };

    case ACTIONS.SET_LOADING_ALL_FILES:
      return {
        ...state,
        loadingAllFiles: payload.loadingAllFiles,
      };

    default:
      return state;
  }
}

export function useFolder(folderId = null, folder = null) {
  const [state, dispatch] = useReducer(reducer, {
    folderId,
    folder,
    childFolders: [],
    childFiles: [],
    allUserFiles: [],
    allUserFolders: [],
    loadingAllFiles: false,
    refresh: false,
  });

  const { currentUser, getIdToken } = useAuth();

  useEffect(() => {
    dispatch({
      type: ACTIONS.SELECT_FOLDER,
      payload: { folderId, folder },
    });
  }, [folderId, folder]);

  useEffect(() => {
    if (folderId == null) {
      dispatch({
        type: ACTIONS.UPDATE_FOLDER,
        payload: { folder: ROOT_FOLDER },
      });
      return;
    }

    const folderRef = doc(database.folders, folderId);

    getDoc(folderRef)
      .then((docSnapshot) => {
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: {
            folder: docSnapshot.exists()
              ? database.formatDoc(docSnapshot)
              : ROOT_FOLDER,
          },
        });
      })
      .catch(() => {
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: { folder: ROOT_FOLDER },
        });
      });
  }, [folderId, state.refresh]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      database.folders,
      where("parentId", "==", folderId),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      dispatch({
        type: ACTIONS.SET_CHILD_FOLDERS,
        payload: {
          childFolders: snapshot.docs.map(database.formatDoc),
        },
      });
    });

    return () => unsubscribe();
  }, [folderId, currentUser?.uid, state.refresh]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!currentUser?.uid) return;

      try {
        const token = await getIdToken();
        if (!token) return;

        const res = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/folders/${folderId}/files`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        dispatch({
          type: ACTIONS.SET_CHILD_FILES,
          payload: { childFiles: data.files || [] },
        });
      } catch (error) {
        console.error("Failed to fetch files:", error);

        dispatch({
          type: ACTIONS.SET_CHILD_FILES,
          payload: { childFiles: [] },
        });
      }
    };

    fetchFiles();
  }, [folderId, currentUser?.uid, getIdToken, state.refresh]);

  useEffect(() => {
    const fetchAllUserFiles = async () => {
      if (!currentUser?.uid) return;

      dispatch({
        type: ACTIONS.SET_LOADING_ALL_FILES,
        payload: { loadingAllFiles: true },
      });

      try {
        const token = await getIdToken();
        if (!token) return;

        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/files/user`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch all user files");
        }

        const data = await response.json();

        dispatch({
          type: ACTIONS.SET_ALL_USER_FILES,
          payload: { allUserFiles: data.files || [] },
        });
      } catch (error) {
        console.error("Error fetching all user files:", error);

        dispatch({
          type: ACTIONS.SET_ALL_USER_FILES,
          payload: { allUserFiles: [] },
        });
      } finally {
        dispatch({
          type: ACTIONS.SET_LOADING_ALL_FILES,
          payload: { loadingAllFiles: false },
        });
      }
    };

    fetchAllUserFiles();
  }, [currentUser?.uid, getIdToken, state.refresh]);

  useEffect(() => {
    const fetchAllUserFolders = async () => {
      if (!currentUser?.uid) return;

      try {
        const token = await getIdToken();
        if (!token) return;

        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/folders/user`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch all user folders");
        }

        const data = await response.json();

        dispatch({
          type: ACTIONS.SET_ALL_USER_FOLDERS,
          payload: { allUserFolders: data.folders || [] },
        });
      } catch (error) {
        console.error("Error fetching all user folders:", error);

        dispatch({
          type: ACTIONS.SET_ALL_USER_FOLDERS,
          payload: { allUserFolders: [] },
        });
      }
    };

    fetchAllUserFolders();
  }, [currentUser?.uid, getIdToken, state.refresh]);

  const triggerRefresh = () => {
    dispatch({ type: ACTIONS.TRIGGER_REFRESH });
  };

  return {
    ...state,
    triggerRefresh,
  };
}