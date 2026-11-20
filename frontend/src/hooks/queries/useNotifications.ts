import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notification.service";
import { NotificationsData } from "../../types/notification.types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export const useNotificationsQuery = (enabled: boolean = true) => {
  return useQuery<NotificationsData, Error>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};
