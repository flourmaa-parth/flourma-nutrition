import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const verifyToken = async () => {
  const response = await api.get("/auth/verify");
  return response.data;
};

// Public
export const lookupOrder = async (order_number, last_name) => {
  const response = await api.post("/lookup", { order_number, last_name });
  return response.data;
};

export const getRDA = async () => {
  const response = await api.get("/rda");
  return response.data;
};

// Admin - RDA Settings
export const getAdminRDA = async () => {
  const response = await api.get("/admin/rda");
  return response.data;
};

export const updateRDA = async (data) => {
  const response = await api.put("/admin/rda", data);
  return response.data;
};

// SKUs
export const getSKUs = async () => {
  const response = await api.get("/skus");
  return response.data;
};

export const createSKU = async (data) => {
  const response = await api.post("/skus", data);
  return response.data;
};

export const updateSKU = async (id, data) => {
  const response = await api.put(`/skus/${id}`, data);
  return response.data;
};

export const deleteSKU = async (id) => {
  const response = await api.delete(`/skus/${id}`);
  return response.data;
};

// Supplements
export const getSupplements = async () => {
  const response = await api.get("/supplements");
  return response.data;
};

export const createSupplement = async (data) => {
  const response = await api.post("/supplements", data);
  return response.data;
};

export const updateSupplement = async (id, data) => {
  const response = await api.put(`/supplements/${id}`, data);
  return response.data;
};

export const deleteSupplement = async (id) => {
  const response = await api.delete(`/supplements/${id}`);
  return response.data;
};

// Orders
export const getOrders = async () => {
  const response = await api.get("/orders");
  return response.data;
};

export const createOrder = async (data) => {
  const response = await api.post("/orders", data);
  return response.data;
};

export const updateOrder = async (id, data) => {
  const response = await api.put(`/orders/${id}`, data);
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
};
