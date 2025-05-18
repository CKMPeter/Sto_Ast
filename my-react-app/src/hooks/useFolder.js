import { useReducer, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { database } from "../firebase";
import { getDoc, doc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { realtimeDatabase } from "../firebase"; // Import Realtime Database
import { ref, onValue } from "firebase/database";

const ACTIONS = {
  SELECT_FOLDER: "select-folder",
  UPDATE_FOLDER: "update-folder",
  SET_CHILD_FOLDERS: "set-child-folders",
  SET_CHILD_FILES: "set-child-files",
};

export const ROOT_FOLDER = { name: "Root", id: null, path: [] };

function reducer(state, { type, payload }) {
  switch (type) {
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
    default:
      return state;
  }
}

export function useFolder(folderId = null, folder = null) {
  const [state, dispatch] = useReducer(reducer, {
    folderId,
    folder,  // Ensures a valid folder object
    childFolders: [],
    childFiles: [],
  });
  
  const { currentUser, getIdToken } = useAuth();

  useEffect(() => {
    dispatch({ type: ACTIONS.SELECT_FOLDER, payload: { folderId, folder } });
  }, [folderId, folder]);

  useEffect(() => {
    if (folderId == null) {
      return dispatch({
        type: ACTIONS.UPDATE_FOLDER,
        payload: { folder: ROOT_FOLDER },
      });
    }

    const folderRef = doc(database.folders, folderId); // Use correct reference to collection
    getDoc(folderRef)
      .then(docSnapshot => {
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
  }, [folderId]);

  useEffect(() => {
    // Construct the query for Firestore child folders
    const q = query(
      database.folders, // The reference to the 'folders' collection
      where("parentId", "==", folderId), // Filter by parentId
      where("userId", "==", currentUser.uid), // Filter by userId
      orderBy("createdAt") // Order by createdAt field
    );

    // Set up the listener for real-time updates
    const unsubscribe = onSnapshot(q, snapshot => {
      dispatch({
        type: ACTIONS.SET_CHILD_FOLDERS,
        payload: { childFolders: snapshot.docs.map(database.formatDoc) }
      });
    });

    // Cleanup the listener when the component unmounts or the folderId or currentUser changes
    return () => unsubscribe();

  }, [folderId, currentUser.uid]);

  useEffect(() => {
    // Ensure currentUser and folderId are available
    if (!currentUser?.uid) return;

    console.log("User UID:", currentUser.uid);
    console.log("Folder ID:", folderId);

    // Check if we are dealing with the root folder (folderId is null)
    const folderPath = folderId === null ? `files/${currentUser.uid}` : `files/${currentUser.uid}/${folderId}`;

    // Reference to the Firebase Realtime Database location for files
    const filesRef = ref(realtimeDatabase, folderPath);
    console.log("Files Ref Path:", filesRef.toString());

    const unsubscribe = onValue(filesRef, (snapshot) => {
      const filesData = snapshot.val();
      if (filesData) {
        // Format files with path and render children files based on path
        const formattedFiles = Object.keys(filesData).map((key) => {
          const file = filesData[key];

          // Add path to the file object if it's missing
          if (!file.path) {
            file.path = key; // Use the key as the path if it's not available
          }

          return {
            id: key,
            ...file, // Include other file properties like name, url, etc.
          };
        });

        console.log("Formatted Files with Path:", formattedFiles); // Log files with their paths

        // Dispatch formatted files to the state
        dispatch({
          type: ACTIONS.SET_CHILD_FILES,
          payload: { childFiles: formattedFiles },
        });
      } else {
        // If no files are found, set an empty array
        dispatch({
          type: ACTIONS.SET_CHILD_FILES,
          payload: { childFiles: [] },
        });
      }
    });

    // Cleanup listener when folderId or currentUser changes
    return () => unsubscribe();
  }, [folderId, currentUser]);

  useEffect(() => {
    // If the user is authenticated, fetch folders/files from the backend
    async function fetchFromBackend() {
      if (!currentUser) return;

      const token = await getIdToken();
      if (!token) return;

      // Construct the request for folders from backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/folders?parentId=${folderId}&userId=${currentUser.uid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

    fetchFromBackend();

  }, [folderId, currentUser, getIdToken]);

  return state;
}
