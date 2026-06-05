import React, { useEffect, useMemo, useState } from "react";
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 992);

  const { darkMode, loading } = useDarkMode();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 992);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleChatbot = () => setShowChatbot((prev) => !prev);

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
      regex.test(part) ? <mark key={i}>{part}</mark> : part,
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

  const isPathMatch = (path) => {
    if (!cleanSearchQuery) return true;
    return normalize(path).includes(normalize(cleanSearchQuery));
  };

  const filesWithFullPath = useMemo(() => {
    if (!Array.isArray(allUserFiles)) return [];

    const folderNameMap = {};

    if (Array.isArray(allUserFolders)) {
      allUserFolders.forEach((folder) => {
        folderNameMap[folder.id] = folder.name;
      });
    }

    return allUserFiles.map((file) => {
      const pathSegments =
        typeof file.path === "string" && file.path.length > 0
          ? file.path.split("/")
          : [];

      const readablePath = pathSegments.map((segment) => {
        if (segment === "null" || segment === null) return "root";
        return folderNameMap[segment] || segment;
      });

      if (readablePath[0] !== "root") {
        readablePath.unshift("root");
      }

      if (file.name && readablePath[readablePath.length - 1] !== file.name) {
        readablePath.push(file.name);
      }

      return {
        ...file,
        readablePath: readablePath.join("/"),
      };
    });
  }, [allUserFiles, allUserFolders]);

  const isSearching = searchQuery.trim().length > 0;

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
    const sourceFolders = isSearching
      ? allUserFolders || []
      : childFolders || [];

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
        className="dashboard-bg-logo"
        style={{
          ...styleSheet.bgLogo,
          ...(isTablet ? styleSheet.bgLogoTablet : {}),
          ...(isMobile ? styleSheet.bgLogoMobile : {}),
        }}
      />

      <Container
        fluid
        className={darkMode ? "dark-mode" : "light-mode"}
        style={{
          ...styleSheet.container,
          color: darkMode ? "#ffffff" : "#023047",
          backgroundColor: darkMode ? "#121212" : "#f8fdff",
        }}
      >
        <div
          className="d-flex align-items-center justify-content-between flex-wrap"
          style={isMobile ? styleSheet.toolbarMobile : {}}
        >
          <div
            className="d-flex align-items-center flex-grow-1 flex-wrap gap-2"
            style={isMobile ? styleSheet.actionsMobile : {}}
          >
            <FolderBreadcrumbs currentFolder={folder} darkMode={darkMode} />

            <AddFolderButton currentFolder={folder} darkMode={darkMode} />

            <AddFileButton
              currentFolder={folder}
              onAdd={triggerRefresh}
              darkMode={darkMode}
            />

            <Form.Control
              type="text"
              placeholder="🔍 Search name, path, content... (#tag, type:pdf)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...styleSheet.search,
                ...(isTablet ? styleSheet.searchTablet : {}),
                backgroundColor: darkMode ? "#12384c" : "#ffffff",
                color: darkMode ? "#ffffff" : "#023047",
                borderColor: darkMode ? "#16425b" : "#caf0f8",
              }}
            />
          </div>
        </div>

        {isSearching && (
          <div
            style={{
              ...styleSheet.searchLabel,
              background: darkMode ? "#12384c" : "#e6f7fc",
              color: darkMode ? "#eaf8fc" : "#0077b6",
              border: darkMode ? "1px solid #16425b" : "1px solid #caf0f8",
            }}
          >
            Showing global search results for: "{searchQuery}"
          </div>
        )}

        <div
          className="d-flex flex-wrap mt-3"
          style={isMobile ? styleSheet.gridMobile : {}}
        >
          {visibleFolders.map((child) => {
            const folderInstance = FolderClass.fromObject(child);

            folderInstance.highlightedName = highlightText(
              child.name,
              searchQuery,
            );

            return (
              <div
                key={child.id}
                className="p-2"
                style={{
                  ...styleSheet.item,
                  ...(isMobile ? styleSheet.itemMobile : {}),
                }}
              >
                <Folder folder={folderInstance} darkMode={darkMode} />
              </div>
            );
          })}
        </div>

        <div
          className="d-flex flex-wrap mt-3"
          style={isMobile ? styleSheet.gridMobile : {}}
        >
          {visibleFiles.map((child) => (
            <div
              key={child.id}
              className="p-2"
              style={{
                ...styleSheet.item,
                ...(isMobile ? styleSheet.itemMobile : {}),
              }}
            >
              <File
                file={{
                  ...child,
                  highlightedName: highlightText(child.name, searchQuery),
                }}
                onChange={triggerRefresh}
                darkMode={darkMode}
              />

              {isSearching && child.readablePath && (
                <div
                  style={{
                    ...styleSheet.filePath,
                    color: darkMode ? "#b8dce8" : "#6c757d",
                  }}
                >
                  {highlightText(child.readablePath, searchQuery)}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={toggleChatbot}
          style={{
            ...styleSheet.chatButton,
            ...(showChatbot ? styleSheet.chatButtonOpen : {}),
          }}
        >
          {showChatbot ? "✖" : "💬"}
        </button>

        {showChatbot && (
          <div
            style={{
              ...styleSheet.chatbot,
              ...(isTablet ? styleSheet.chatbotTablet : {}),
              ...(isMobile ? styleSheet.chatbotMobile : {}),
            }}
          >
            <Chatbot allUserFiles={filesWithFullPath} darkMode={darkMode} />
          </div>
        )}
      </Container>
    </>
  );
}

const styleSheet = {
  bgLogo: {
    height: "50%",
    opacity: "30%",
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  bgLogoTablet: {
    height: "35%",
    top: "38%",
  },

  bgLogoMobile: {
    height: "22%",
    top: "42%",
    opacity: "18%",
  },

  container: {
    minHeight: "100vh",
    paddingTop: "1rem",
    position: "relative",
    zIndex: 1,
  },

  toolbarMobile: {
    display: "block",
  },

  actionsMobile: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },

  search: {
    maxWidth: 360,
    height: 42,
    marginLeft: "10px",
    borderRadius: "14px",
    boxShadow: "0 4px 14px rgba(0,119,182,0.08)",
  },

  searchTablet: {
    maxWidth: "100%",
    width: "100%",
    marginLeft: 0,
  },

  searchLabel: {
    marginTop: "14px",
    padding: "10px 14px",
    borderRadius: "14px",
    fontWeight: 600,
  },

  gridMobile: {
    justifyContent: "left",
  },

  item: {
    maxWidth: "200px",
  },

  itemMobile: {
    width: "50%",
    maxWidth: "180px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  filePath: {
    fontSize: "12px",
    marginTop: "4px",
    maxWidth: "180px",
    wordBreak: "break-word",
  },

  chatButton: {
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
  },

  chatButtonOpen: {
   marginBottom: "0",
    right: "38px",
    zIndex: 2001,
  },

  chatbot: {
    position: "fixed",
    top: "90px",
    right: "28px",
    width: "420px",
    height: "calc(100vh - 140px)",
    minHeight: "560px",
    maxHeight: "720px",
    zIndex: 1999,
  },

  chatbotTablet: {
    width: "360px",
    right: "16px",
  },

  chatbotMobile: {
    top: "auto",
    left: "10px",
    right: "10px",
    bottom: "95px",
    width: "auto",
    height: "65vh",
    minHeight: "360px",
    maxHeight: "none",
  },
};
