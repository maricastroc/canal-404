"use client";

import { useMemo } from "react";
import { useWeeklyGame } from "@/components/catalog/useSchedule";
import { NAV_ITEMS, type NavItem } from "./nav";

export function useNavItems(): NavItem[] {
  const weekly = useWeeklyGame();
  return useMemo(() => NAV_ITEMS.map((item) => (item.weekly ? { ...item, href: `/games/${weekly.slug}` } : item)), [weekly]);
}
