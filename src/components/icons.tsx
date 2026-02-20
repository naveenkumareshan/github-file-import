
import React from "react";
import { LogIn, User, Sun, Moon, Menu } from "lucide-react";

export type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  logo: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 22V12C2 8 5 5 9 5C13 5 16 8 16 12V22" />
      <path d="M2 15H16" />
      <path d="M22 5V19" />
      <path d="M18 9H22" />
      <path d="M18 15H22" />
    </svg>
  ),
  login: LogIn,
  user: User,
  sun: Sun,
  moon: Moon,
  menu: Menu,
};
