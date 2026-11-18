"use client";

import type { ComponentProps } from "react";
import { IntentLink } from "@/components/ui/IntentLink";
import type { NavItem } from "./nav";

export function NavLink({ item, ...props }: Omit<ComponentProps<typeof IntentLink>, "href"> & { item: NavItem }) {
  return <IntentLink href={item.href} {...props} />;
}
