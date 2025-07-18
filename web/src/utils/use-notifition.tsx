import { useContext } from "react"
import { NotificationInstance } from "antd/es/notification/interface"

import { NotifyContext } from "@/components/notify/context"

const useNotification = () => {
  const notify = useContext(NotifyContext)

  return (notify as NotificationInstance)
}

export default useNotification