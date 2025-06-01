import { useReducer, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { database } from "../firebase";
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
};

export const ROOT_FOLDER = { name: "Root", id: null, path: [] };

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.TRIGGER_REFRESH:
      return {
        ...state,
        refresh: !state.refresh,
      };
    case ACTIONS.SELECT_FOLDER:
      return {
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
    default:
      return state;
  }
}

export function useFolder(folderId = null, folder = null) {
  const [state, dispatch] = useReducer(reducer, {
    folderId,
    folder, // Ensures a valid folder object
    childFolders: [],
    childFiles: [],
    allUserFiles: [],
    allUserFolders: [],
    refresh: false,
  });

  const { currentUser, getIdToken } = useAuth();

  // --- Select folder ---
  // This effect updates the selected folder in the state when the folderId or folder changes.
  useEffect(() => {
    dispatch({ type: ACTIONS.SELECT_FOLDER, payload: { folderId, folder } });
  }, [folderId, folder, state.refresh]);

  // --- Fetch folder from Firestore ---
  // This effect fetches the folder from Firestore when the folderId changes.
  useEffect(() => {
    if (folderId == null) {
      return dispatch({
        type: ACTIONS.UPDATE_FOLDER,
        payload: { folder: ROOT_FOLDER },
      });
    }

    const folderRef = doc(database.folders, folderId); // Use correct reference to collection
    getDoc(folderRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          dispatch({
            type: ACTIONS.UPDATE_FOLDER,
            payload: { folder: database.formatDoc(docSnapshot) },
          });
        } else {
          dispatch({
            type: ACTIONS.UPDATE_FOLDER,
            payload: { folder: ROOT_FOLDER },
          });
        }
      })
      .catch(() => {
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: { folder: ROOT_FOLDER },
        });
      });
  }, [folderId, state.refresh]);

  // --- Fetch folders/files from the backend ---
  // This effect fetches folders and files from the backend when the component mounts
  // and when the folderId or currentUser changes.
  /*
  useEffect(() => {
    async function fetchFoldersAndFiles() {
      const token = await getIdToken();
      if (!token) return;

      // Construct the request for folders from backend
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/files`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data?.childFolders) {
        dispatch({
          type: ACTIONS.SET_CHILD_FOLDERS,
          payload: { childFolders: data.childFolders },
        });
      }

      if (data?.childFiles) {
        dispatch({
          type: ACTIONS.SET_CHILD_FILES,
          payload: { childFiles: data.childFiles },
        });
      }
    }

    fetchFoldersAndFiles();
  }, [folderId, getIdToken, currentUser.uid, state.refresh]);
 */
  // --- Fetch child folders from Firestore ---
  // This effect fetches child folders from Firestore when the folderId or currentUser changes.
  useEffect(() => {
    // Construct the query for Firestore child folders
    const q = query(
      database.folders, // The reference to the 'folders' collection
      where("parentId", "==", folderId), // Filter by parentId
      where("userId", "==", currentUser.uid), // Filter by userId
      orderBy("createdAt") // Order by createdAt field
    );

    // Set up the listener for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      dispatch({
        type: ACTIONS.SET_CHILD_FOLDERS,
        payload: { childFolders: snapshot.docs.map(database.formatDoc) },
      });
    });

    // Cleanup the listener when the component unmounts or the folderId or currentUser changes
    return () => unsubscribe();
  }, [folderId, currentUser.uid, state.refresh]);

  // --- Fetch files from Firebase Realtime Database ---
  // This effect fetches files from Firebase Realtime Database when the folderId or currentUser changes.
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch(
         `${process.env.REACT_APP_BACKEND_URL}/api/folders/${folderId}/files`,
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
  }, [folderId, getIdToken, state.refresh]);

  // --- getallUserFiles ---
  useEffect(() => {
  const fetchAllUserFiles = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/files/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch all user files");
      }

      const data = await response.json();

      dispatch({
        type: ACTIONS.SET_ALL_USER_FILES,
        payload: { allUserFiles: data.files || [] }, // adjust if response shape is different
      });
      } catch (error) {
        console.error("Error fetching all user files:", error);
        dispatch({
          type: ACTIONS.SET_ALL_USER_FILES,
          payload: { allUserFiles: [] },
        });
      }
    };

    if (currentUser?.uid) {
      fetchAllUserFiles();
    }
  }, [currentUser?.uid, getIdToken, state.refresh]);

// --- getallUserFolders ---
  useEffect(() => {
    const fetchAllUserFolders = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;

        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/folders/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

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

    if (currentUser?.uid) {
      fetchAllUserFolders();
    }
  }, [currentUser?.uid, getIdToken, state.refresh]);


  // Expose a triggerRefresh function
  // This function can be called to trigger a refresh of the folder and its contents.
  const triggerRefresh = () => dispatch({ type: ACTIONS.TRIGGER_REFRESH });

  return { ...state, triggerRefresh };
}
