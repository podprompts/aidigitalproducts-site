"use client";

import { createContext, useContext } from "react";

interface AdminCtx {
  token: string;
  logout: () => void;
}

export const AdminContext = createContext<AdminCtx>({ token: "", logout: () => {} });
export const useAdmin = () => useContext(AdminContext);

export function adminHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", "x-admin-key": token };
}
