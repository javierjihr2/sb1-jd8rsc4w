
"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Monitor, Sun, Moon, Map } from "lucide-react"

interface ChatThemeSettingsProps {
    children: React.ReactNode;
    setTheme: (theme: string) => void;
}

const themes = [
    { name: "Default", value: "bg-chat-default", icon: Monitor },
    { name: "Erangel", value: "bg-chat-erangel", icon: Map },
    { name: "Miramar", value: "bg-chat-miramar", icon: Map },
    { name: "Sanhok", value: "bg-chat-sanhok", icon: Map },
]

export function ChatThemeSettings({ children, setTheme }: ChatThemeSettingsProps) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Fondos de Chat</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((theme) => (
             <DropdownMenuItem key={theme.value} onClick={() => setTheme(theme.value)}>
                <theme.icon className="mr-2 h-4 w-4" />
                <span>{theme.name}</span>
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
