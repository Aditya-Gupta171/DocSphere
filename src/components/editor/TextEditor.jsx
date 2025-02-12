import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import io from "socket.io-client";
import api from "../../api/axios";
import CursorOverlay from "./CursorOverlay";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"]
];

const TextEditor = ({ documentId, onSaving }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const socketRef = useRef();
  const saveTimeoutRef = useRef();
  const [isReadOnly, setIsReadOnly] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const isInitializedRef = useRef(false);

  useEffect(() => {
    let quill = null;

    const initializeEditor = async () => {
      if (!editorRef.current || isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        const { data } = await api.get(`/documents/${documentId}`);
        
        const isOwner = data.owner === user.id;
        const collaborator = data.collaborators?.find(
          c => c.user._id === user.id
        );
        const isReadOnlyMode = !isOwner && collaborator?.accessLevel === 'read';
        setIsReadOnly(isReadOnlyMode);

        // Remove any existing toolbars first
        document.querySelectorAll('.ql-toolbar').forEach(toolbar => toolbar.remove());

        // Initialize Quill
        quill = new Quill(editorRef.current, {
          theme: 'snow',
          modules: {
            toolbar: isReadOnlyMode ? false : TOOLBAR_OPTIONS
          },
          placeholder: 'Start typing...',
          readOnly: isReadOnlyMode
        });

        quillRef.current = quill;

        // Set initial content silently
        if (data.content) {
          const parsedContent = JSON.parse(data.content);
          quill.setContents(parsedContent, 'silent');
        }

        // Setup socket
        const socket = io(import.meta.env.VITE_WS_URL, {
          reconnection: false // Prevent auto reconnection
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-document', {
            documentId,
            user: { id: user.id, name: user.name }
          });
        });

        let isReceiving = false;

        socket.on('receive-changes', (delta) => {
          if (!isReceiving && quill) {
            isReceiving = true;
            quill.updateContents(delta, 'api');
            isReceiving = false;
          }
        });

        quill.on('text-change', (delta, oldDelta, source) => {
          if (source !== 'user' || isReadOnlyMode || isReceiving) return;

          socket.emit('send-changes', { delta, documentId });

          // Handle auto-save
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(async () => {
            try {
              onSaving?.(true);
              const content = JSON.stringify(quill.getContents());
              await api.put(`/documents/${documentId}`, { content });
            } finally {
              onSaving?.(false);
            }
          }, 1000);
        });
      } catch (err) {
        console.error('Failed to initialize editor:', err);
      }
    };

    const cleanup = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
      }
      document.querySelectorAll('.ql-toolbar').forEach(toolbar => toolbar.remove());
      isInitializedRef.current = false;
    };

    cleanup();
    initializeEditor();

    return cleanup;
  }, [documentId, user.id, onSaving]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto relative">
        <div ref={editorRef} className="h-full" />
        <CursorOverlay socket={socketRef.current} quill={quillRef.current} />
      </div>
    </div>
  );
};

export default TextEditor;