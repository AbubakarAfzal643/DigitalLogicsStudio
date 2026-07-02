import axios from "axios";

const LOCAL_API_URL = "http://localhost:5000/api";

function resolveApiBaseUrl() {
  const configured = process.env.REACT_APP_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return LOCAL_API_URL;
}

function resolveAiBaseUrl() {
  const configuredAi = process.env.REACT_APP_AI_URL?.trim();
  if (configuredAi) return configuredAi.replace(/\/+$/, "");
  return `${resolveApiBaseUrl()}/ai`;
}

const aiClient = axios.create({
  baseURL: resolveAiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    } else if (error.response?.status === 401) {
      error.message = "Please log in to use DLS Mentor.";
    } else if (!error.response) {
      error.message = "Cannot reach DLS Mentor. Make sure the backend server is running.";
    }
    return Promise.reject(error);
  },
);

export const sendChatMessage = (message, context) =>
  aiClient.post("/chat", { message, context });

export default aiClient;
