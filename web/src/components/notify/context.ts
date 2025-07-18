import { createContext } from "react";
import { NotificationInstance } from "antd/es/notification/interface";

export const NotifyContext = createContext<NotificationInstance | null>(null)