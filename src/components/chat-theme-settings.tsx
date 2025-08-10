
"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Monitor, Sun, Moon, Map, Palette, Snowflake, Image as ImageIcon, CheckSquare } from "lucide-react"

interface ChatThemeSettingsProps {
    children: React.ReactNode;
    setTheme: (theme: string) => void;
}

const themes = [
    { name: "Default", value: "bg-chat-default", icon: Monitor },
    { name: "Tema Claro", value: "bg-chat-light", icon: Sun },
    { name: "Tema Oscuro", value: "bg-chat-dark", icon: Moon },
    { name: "Erangel", value: "bg-chat-erangel", icon: Map },
    { name: "Miramar", value: "bg-chat-miramar", icon: Map },
    { name: "Sanhok", value: "bg-chat-sanhok", icon: Map },
    { name: "Vikendi", value: "bg-chat-vikendi", icon: Snowflake },
    { name: "Livik", value: "bg-chat-livik", icon: Map },
    { name: "Mosaico de Skins", value: "bg-chat-skin-mosaic", icon: ImageIcon },
    { name: "Camuflaje Digital", value: "bg-chat-camo", icon: CheckSquare },
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
