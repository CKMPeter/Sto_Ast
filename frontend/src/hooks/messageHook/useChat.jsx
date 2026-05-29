import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, push } from "firebase/database";

// convert Blob/File -> base64
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function useChat(currentUserId, selectedUserId, selectedGroupId) {
  const db = getDatabase();
  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const chatId = selectedGroupId
    ? `group_${selectedGroupId}`
    : currentUserId && selectedUserId
    ? [currentUserId, selectedUserId].sort().join("_")
    : null;

  useEffect(() => {
    if (!chatId) return;

    const chatRef = ref(db, `messages/${chatId}`);

    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setMessages([]);

      const list = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      setMessages(list);
    });
  }, [chatId]);

  // TEXT
  const sendMessage = async (text) => {
    if (!chatId || !text.trim()) return;

    await push(ref(db, `messages/${chatId}`), {
      type: "text",
      text,
      senderId: currentUserId,
      createdAt: Date.now(),
    });
  };

  // FILE (FIXED)
  const sendFile = async (file) => {
    if (!chatId || !file) return;

    try {
      setUploading(true);

      // 🚨 LIMIT FILE SIZE (Firestore limit)
      if (file.size > 800 * 1024) {
        alert("File quá lớn (>800KB). Không thể gửi.");
        setUploading(false);
        return;
      }

      const dataUrl = await blobToDataURL(file);

      await push(ref(db, `messages/${chatId}`), {
        type: "file",
        fileUrl: dataUrl, // base64
        fileName: file.name,
        fileType: file.type,
        senderId: currentUserId,
        createdAt: Date.now(),
      });

    } catch (err) {
      console.error("❌ sendFile error:", err);
    } finally {
      setUploading(false);
    }
  };

  //VOICE
  const sendVoiceMessage = async (blob, durationMs = null) => {
    if (!chatId || !blob) return;

    try {
      setUploading(true);

      const dataUrl = await blobToDataURL(blob);

      await push(ref(db, `messages/${chatId}`), {
        type: "voice",
        voiceDataUrl: dataUrl,
        voiceType: blob.type || "audio/webm",
        voiceDuration: durationMs,
        senderId: currentUserId,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return {
    messages,
    sendMessage,
    sendFile,
    sendVoiceMessage,
    uploading,
  };
}