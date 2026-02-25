// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_VERIFY: "/auth/verify",

  // Courses
  COURSES_LIST: "/courses",
  COURSES_DETAIL: (id) => `/courses/${id}`,
  COURSES_CATEGORIES: "/courses/categories",

  // Lessons
  LESSONS_DETAIL: (id) => `/lectures/${id}`,
  LESSONS_COMPLETE: (id) => `/lectures/${id}/complete`,

  // Enrollments
  ENROLLMENTS_PROGRESS: (courseId) => `/enrollments/${courseId}`,

  // Users
  USERS_PROFILE: "/users/profile",
  USERS_ENROLLMENTS: "/users/enrollments",
};

// API Helper functions
export const apiCall = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};
