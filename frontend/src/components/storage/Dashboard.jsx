import React, { useMemo, useState } from "react";
import { Container, Form } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useFolder } from "../../hooks/storageHook/useFolder";
import { useDarkMode } from "../../hooks/useDarkMode";
import AddFolderButton from "./AddFolderButton";
import Folder from "./Folder";
import Navbar from "../shared/Navbar";
import FolderBreadcrumbs from "./FolderBreadcrumbs";
import AddFileButton from "./AddFileButton";
import File from "./File";
import Chatbot from "./ChatBot";
import { FolderClass } from "../../classes/storageClass/FolderClass";

export default function Dashboard() {
  const { folderId } = useParams();

  const {
    folder,
    childFolders,
    childFiles,
    triggerRefresh,
    allUserFiles,
    allUserFolders,
  } = useFolder(folderId);

  const [showChatbot, setShowChatbot] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { darkMode, loading } = useDarkMode();

  const toggleChatbot = () => setShowChatbot((prev) => !prev);

  //  CHANGE: normalize search text once
  //  WHY: avoids repeating replace/lowercase logic everywhere
  const cleanSearchQuery = searchQuery.replace(/#\w+|type:\w+/g, "").trim();

  const normalize = (str) =>
    typeof str === "string" ? str.toLowerCase().trim() : "";

  const highlightText = (text, query) => {
    if (!query || typeof text !== "string") return text;

    const cleanQuery = query.replace(/(#\w+|type:\w+)/g, "").trim();

    if (!cleanQuery) return text;

    const regex = new RegExp(`(${cleanQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  const isTagMatch = (item) => {
    const match = searchQuery.match(/#(\w+)/);

    if (!match) return true;

    const tags = Array.isArray(item.tags)
      ? item.tags.join(" ")
      : item.tags || "";

    return normalize(tags).includes(normalize(match[1]));
  };

  const isTypeMatch = (file) => {
    const match = searchQuery.match(/type:(\w+)/);

    if (!match) return true;

    const ext = normalize(match[1]);

    return normalize(file.name).endsWith("." + ext);
  };

  const isNameMatch = (name) => {
    if (!cleanSearchQuery) return true;

    return normalize(name).includes(normalize(cleanSearchQuery));
  };

  //  CHANGE: added path search
  //  WHY: your Firestore file has a path field, so dashboard search should use it
  const isPathMatch = (path) => {
    if (!cleanSearchQuery) return true;

    return normalize(path).includes(normalize(cleanSearchQuery));
  };

  //  CHANGE: reconstruct readable path using allUserFolders
  //  WHY: Firestore path may contain folder IDs, but users search folder names
  const filesWithFullPath = useMemo(() => {

    // safety check: if allUserFiles is not an array, return empty list to avoid crashes
    if (!Array.isArray(allUserFiles)) return [];

    const folderNameMap = {};

    // take allUserFolders and create a map of folderId to folderName for easy lookup
    if (Array.isArray(allUserFolders)) {
      allUserFolders.forEach((folder) => {
        folderNameMap[folder.id] = folder.name;
      });
    }

    // for each file, reconstruct a readable path by replacing folder IDs with names
    return allUserFiles.map((file) => {

      // if file.path is a string, split it by "/", otherwise use empty array
      const pathSegments =
        typeof file.path === "string" && file.path.length > 0
          ? file.path.split("/")
          : [];

        // replace each segment with folder name if it's an ID, or keep as is
      const readablePath = pathSegments.map((segment) => {
        if (segment === "null" || segment === null) return "root";

        return folderNameMap[segment] || segment;
      });

      // ensure path starts with "root" and ends with file name for better searchability
      if (readablePath[0] !== "root") {
        readablePath.unshift("root");
      }

      // if file has a name and it's not already the last segment, add it to the end of the path
      if (file.name && readablePath[readablePath.length - 1] !== file.name) {
        readablePath.push(file.name);
      }

      return {
        ...file,
        readablePath: readablePath.join("/"),
      };
    });
  }, [allUserFiles, allUserFolders]);

  //  CHANGE: search mode
  //  WHY: normal folder browsing uses childFiles; global search uses all user files
  const isSearching = searchQuery.trim().length > 0;

  //  CHANGE: fix the old bug:
  // file.folderId === folderId || "null"
  // That was always truthy because "null" is a string.
  const visibleFiles = useMemo(() => {
    const sourceFiles = isSearching ? filesWithFullPath : childFiles || [];

    return sourceFiles.filter((file) => {
      const matchesCurrentFolder =
        file.folderId === folderId ||
        (!folderId && (file.folderId === null || file.folderId === "null"));

      const matchesSearch =
        !isSearching ||
        isNameMatch(file.name) ||
        isPathMatch(file.path) ||
        isPathMatch(file.readablePath) ||
        normalize(file.content).includes(normalize(cleanSearchQuery));

      return (
        (isSearching || matchesCurrentFolder) &&
        matchesSearch &&
        isTypeMatch(file) &&
        isTagMatch(file)
      );
    });
  }, [
    isSearching,
    filesWithFullPath,
    childFiles,
    folderId,
    searchQuery,
    cleanSearchQuery,
  ]);

  const visibleFolders = useMemo(() => {
    const sourceFolders = isSearching ? allUserFolders || [] : childFolders || [];

    return sourceFolders.filter((folder) => {
      const matchesCurrentFolder =
        folder.parentId === folderId ||
        (!folderId && (folder.parentId === null || folder.parentId === "null"));

      const matchesSearch = !isSearching || isNameMatch(folder.name);

      return (
        (isSearching || matchesCurrentFolder) &&
        matchesSearch &&
        isTagMatch(folder) &&
        folder.name !== "undefined"
      );
    });
  }, [isSearching, allUserFolders, childFolders, folderId, searchQuery]);

  if (loading) return null;

  return (
    <>
      <Navbar />

      <img
        src="./Sto_Ast_Logo_Title.png"
        alt=""
        style={{
          height: "50%",
          opacity: "30%",
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Container
        fluid
        className={darkMode ? "dark-mode" : "light-mode"}
        style={{
          minHeight: "100vh",
          paddingTop: "1rem",
          color: darkMode ? "#ffffff" : "#023047",
          backgroundColor: darkMode ? "#121212" : "#f8fdff",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap">
          <div className="d-flex align-items-center flex-grow-1 flex-wrap gap-2">
            <FolderBreadcrumbs
              currentFolder={folder}
              style={{ marginLeft: "10px" }}
            />

            <AddFolderButton currentFolder={folder} />

            <AddFileButton currentFolder={folder} onAdd={triggerRefresh} />

            <Form.Control
              type="text"
              placeholder="🔍 Search name, path, content... (#tag, type:pdf)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                maxWidth: 360,
                height: 42,
                marginLeft: "10px",
                borderRadius: "14px",
                backgroundColor: darkMode ? "#12384c" : "#ffffff",
                color: darkMode ? "#ffffff" : "#023047",
                borderColor: darkMode ? "#16425b" : "#caf0f8",
                boxShadow: "0 4px 14px rgba(0,119,182,0.08)",
              }}
            />
          </div>
        </div>

        {/*  CHANGE: show search mode label */}
        {/*  WHY: user knows result is global, not only current folder */}
        {isSearching && (
          <div
            style={{
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "14px",
              background: darkMode ? "#12384c" : "#e6f7fc",
              color: darkMode ? "#eaf8fc" : "#0077b6",
              border: darkMode ? "1px solid #16425b" : "1px solid #caf0f8",
              fontWeight: 600,
            }}
          >
            Showing global search results for: "{searchQuery}"
          </div>
        )}

        {/* Folder List */}
        <div className="d-flex flex-wrap mt-3">
          {visibleFolders.map((child) => {
            const folderInstance = FolderClass.fromObject(child);

            folderInstance.highlightedName = highlightText(
              child.name,
              searchQuery
            );

            return (
              <div
                key={child.id}
                style={{ maxWidth: "200px" }}
                className="p-2"
              >
                <Folder folder={folderInstance} />
              </div>
            );
          })}
        </div>

        {/* File List */}
        <div className="d-flex flex-wrap mt-3">
          {visibleFiles.map((child) => (
            <div key={child.id} style={{ maxWidth: "200px" }} className="p-2">
              <File
                file={{
                  ...child,
                  highlightedName: highlightText(child.name, searchQuery),
                }}
                onChange={triggerRefresh}
              />

              {/*  CHANGE: show readable path during search */}
              {/*  WHY: user can understand where the file is located */}
              {isSearching && child.readablePath && (
                <div
                  style={{
                    fontSize: "12px",
                    color: darkMode ? "#b8dce8" : "#6c757d",
                    marginTop: "4px",
                    maxWidth: "180px",
                    wordBreak: "break-word",
                  }}
                >
                  {highlightText(child.readablePath, searchQuery)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chatbot Toggle */}
        <button
          onClick={toggleChatbot}
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            width: "58px",
            height: "58px",
            backgroundColor: "#0077b6",
            color: "#ffffff",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 8px 22px rgba(0,119,182,0.35)",
            cursor: "pointer",
            zIndex: 2000,
            fontSize: "22px",
          }}
        >
          {showChatbot ? "✖" : "💬"}
        </button>

        {showChatbot && (
          <div
            style={{
              position: "fixed",
              top: "90px",
              right: "28px",
              width: "420px",
              height: "calc(100vh - 140px)",
              minHeight: "560px",
              maxHeight: "720px",
              zIndex: 1999,
            }}
          >
            <Chatbot allUserFiles={filesWithFullPath} />
          </div>
        )}
      </Container>
    </>
  );
}