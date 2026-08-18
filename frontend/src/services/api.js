import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const uploadDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const analyzeDocument = (documentId) =>
  api.post("/analyze", { document_id: documentId });

export const getResults = (documentId) => api.get(`/results/${documentId}?_t=${Date.now()}`);

export const listDocuments = (skip = 0, limit = 20) =>
  api.get("/documents", { params: { skip, limit } });

export const sendChat = (documentId, question) =>
  api.post("/chat", { document_id: documentId, question });
