import axios from "axios";

// Get API URL from environment variable, with fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Ensure the URL ends with /api
export const API_BASE_URL = API_URL.endsWith("/api")
    ? API_URL
    : `${API_URL}/api`;

const createAuthHeaders = (token) => {
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

export const usersAPI = {
    searchUsers: (query, token) =>
        api.get(`/users/search?query=${encodeURIComponent(query)}`, {
            headers: createAuthHeaders(token),
        }),
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Notes API – supports optional folder filtering
export const notesAPI = {
    getAllNotes: (token, folderId = null) => {
        const url = folderId ? `/notes?folder_id=${folderId}` : "/notes";
        return api.get(url, { headers: createAuthHeaders(token) });
    },
    getNote: (id, token) =>
        api.get(`/notes/${id}`, { headers: createAuthHeaders(token) }),
    createNote: (note, token) =>
        api.post("/notes", note, { headers: createAuthHeaders(token) }),
    updateNote: (id, note, token) =>
        api.put(`/notes/${id}`, note, { headers: createAuthHeaders(token) }),
    deleteNote: (id, token) =>
        api.delete(`/notes/${id}`, { headers: createAuthHeaders(token) }),
    shareNote: (id, data, token) =>
        api.post(`/notes/${id}/share`, data, { headers: createAuthHeaders(token) }),
    getShares: (id, token) =>
        api.get(`/notes/${id}/shares`, { headers: createAuthHeaders(token) }),
    resendShareNotification: (noteId, email, token) =>
        api.post(`/notes/${noteId}/shares/${encodeURIComponent(email)}/resend`, {}, { headers: createAuthHeaders(token) }),
    unshareNote: (noteId, email, token) =>
        api.delete(`/notes/${noteId}/shares/${encodeURIComponent(email)}`, { headers: createAuthHeaders(token) }),
};

export const chatsAPI = {
    getAllChats: (token) =>
        api.get("/chats", { headers: createAuthHeaders(token) }),
    getChat: (id, token) =>
        api.get(`/chats/${id}`, { headers: createAuthHeaders(token) }),
    createChat: (chat, token) =>
        api.post("/chats", chat, { headers: createAuthHeaders(token) }),
    updateChat: (id, chat, token) =>
        api.put(`/chats/${id}`, chat, { headers: createAuthHeaders(token) }),
    deleteChat: (id, token) =>
        api.delete(`/chats/${id}`, { headers: createAuthHeaders(token) }),
};

export const aiAPI = {
    chat: (message, currentContent, editMode, token, history = []) =>
        api.post(
            "/ai/chat",
            {
                message,
                current_content: currentContent,
                edit_mode: editMode,
                messages: history,
            },
            { headers: createAuthHeaders(token) }
        ),

    // Streaming chat using Server-Sent Events
    chatStream: (message, currentContent, editMode, token, history = [], onChunk, onComplete, onError) => {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const url = `${API_URL}/api/ai/chat/stream`;

        // Use fetch with streaming for maximum control
        const controller = new AbortController();

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message,
                current_content: currentContent,
                edit_mode: editMode,
                messages: history
            }),
            signal: controller.signal
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        onComplete();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                onComplete();
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    onChunk(parsed.content);
                                } else if (parsed.error) {
                                    onError(new Error(parsed.error));
                                    return;
                                }
                            } catch (e) {
                                // Ignore parse errors for incomplete chunks
                            }
                        }
                    }
                }
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    onError(error);
                }
            });

        // Return abort function
        return () => controller.abort();
    }
};

export const settingsAPI = {
    getSettings: (token) =>
        api.get("/settings", { headers: createAuthHeaders(token) }),
    updateSettings: (settings, token) =>
        api.put("/settings", settings, { headers: createAuthHeaders(token) }),
    testLLMConnection: (provider, apiKey, model, token) =>
        api.post("/test-llm-connection",
            { provider, api_key: apiKey, model },
            { headers: createAuthHeaders(token) }
        ),
};

// Folder API
export const foldersAPI = {
    getAllFolders: (token) =>
        api.get("/folders", { headers: createAuthHeaders(token) }),
    createFolder: (folderData, token) =>
        api.post("/folders", folderData, { headers: createAuthHeaders(token) }),
    updateFolder: (id, folderData, token) =>
        api.put(`/folders/${id}`, folderData, {
            headers: createAuthHeaders(token),
        }),
    deleteFolder: (id, token, moveToRoot = true, destinationFolderId = null) => {
        let url = `/folders/${id}?move_to_root=${moveToRoot}`;
        if (destinationFolderId) {
            url += `&destination_folder_id=${destinationFolderId}`;
        }
        return api.delete(url, { headers: createAuthHeaders(token) });
    },
    shareFolder: (id, data, token) =>
        api.post(`/folders/${id}/share`, data, {
            headers: createAuthHeaders(token),
        }),
    getShares: (id, token) =>
        api.get(`/folders/${id}/shares`, { headers: createAuthHeaders(token) }),
    resendShareNotification: (folderId, email, token) =>
        api.post(`/folders/${folderId}/shares/${encodeURIComponent(email)}/resend`, {}, { headers: createAuthHeaders(token) }),
    unshareFolder: (folderId, email, token) =>
        api.delete(`/folders/${folderId}/shares/${encodeURIComponent(email)}`, { headers: createAuthHeaders(token) }),
};

// MongoDB API
export const mongodbAPI = {
    verifyConnection: (connectionString) =>
        api.post("/verify-mongodb", { connection_string: connectionString }),
    updateUserDatabase: (connectionString, token) =>
        api.post(
            "/user/update-database",
            { connection_string: connectionString },
            { headers: createAuthHeaders(token) }
        ),
};

export default api;
