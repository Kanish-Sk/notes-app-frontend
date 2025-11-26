import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const createAuthHeaders = (token) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const usersAPI = {
    searchUsers: (query, token) => api.get(`/users/search?query=${encodeURIComponent(query)}`, { headers: createAuthHeaders(token) }),
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Notes API – supports optional folder filtering
export const notesAPI = {
    getAllNotes: (token, folderId = null) => {
        const url = folderId ? `/notes?folder_id=${folderId}` : '/notes';
        return api.get(url, { headers: createAuthHeaders(token) });
    },
    getNote: (id, token) => api.get(`/notes/${id}`, { headers: createAuthHeaders(token) }),
    createNote: (note, token) => api.post('/notes', note, { headers: createAuthHeaders(token) }),
    updateNote: (id, note, token) => api.put(`/notes/${id}`, note, { headers: createAuthHeaders(token) }),
    deleteNote: (id, token) => api.delete(`/notes/${id}`, { headers: createAuthHeaders(token) }),
    shareNote: (id, data, token) => api.post(`/notes/${id}/share`, data, { headers: createAuthHeaders(token) }),
};

export const chatsAPI = {
    getAllChats: (token) => api.get('/chats', { headers: createAuthHeaders(token) }),
    getChat: (id, token) => api.get(`/chats/${id}`, { headers: createAuthHeaders(token) }),
    createChat: (chat, token) => api.post('/chats', chat, { headers: createAuthHeaders(token) }),
    updateChat: (id, chat, token) => api.put(`/chats/${id}`, chat, { headers: createAuthHeaders(token) }),
    deleteChat: (id, token) => api.delete(`/chats/${id}`, { headers: createAuthHeaders(token) }),
};

export const aiAPI = {
    chat: (message, currentContent, editMode, token) =>
        api.post('/ai/chat', {
            message,
            current_content: currentContent,
            edit_mode: editMode,
        }, { headers: createAuthHeaders(token) }),
};

export const settingsAPI = {
    getSettings: (token) => api.get('/settings', { headers: createAuthHeaders(token) }),
    updateSettings: (settings, token) => api.put('/settings', settings, { headers: createAuthHeaders(token) }),
};

// Folder API
export const foldersAPI = {
    getAllFolders: (token) => api.get('/folders', { headers: createAuthHeaders(token) }),
    createFolder: (folderData, token) => api.post('/folders', folderData, { headers: createAuthHeaders(token) }),
    updateFolder: (id, folderData, token) => api.put(`/folders/${id}`, folderData, { headers: createAuthHeaders(token) }),
    deleteFolder: (id, token, moveToRoot = true, destinationFolderId = null) => {
        let url = `/folders/${id}?move_to_root=${moveToRoot}`;
        if (destinationFolderId) {
            url += `&destination_folder_id=${destinationFolderId}`;
        }
        return api.delete(url, { headers: createAuthHeaders(token) });
    },
    shareFolder: (id, data, token) => api.post(`/folders/${id}/share`, data, { headers: createAuthHeaders(token) }),
};

// MongoDB API
export const mongodbAPI = {
    verifyConnection: (connectionString) => api.post('/verify-mongodb', { connection_string: connectionString }),
    updateUserDatabase: (connectionString, token) => api.post('/user/update-database', { connection_string: connectionString }, { headers: createAuthHeaders(token) }),
};

export default api;
