import React, { ReactNode } from "react";
import { notification } from "antd";

import { NotifyContext } from "./context";

const NotifyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification({
    maxCount: 3,
  });

  return (
    <NotifyContext.Provider value={api}>
      {children}
      {contextHolder}
    </NotifyContext.Provider>
  )
}

export default NotifyProvider