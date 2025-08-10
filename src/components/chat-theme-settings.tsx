
"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Monitor, Sun, Moon, Map, Palette, Snowflake, Image as ImageIcon, Upload, Flame, Bot } from "lucide-react"

interface ChatThemeSettingsProps {
    children: React.ReactNode;
    setTheme: (theme: string) => void;
    onUploadClick: () => void;
}

const themes = [
    { name: "Default", value: "bg-chat-default", icon: Monitor },
    { name: "Tema Claro", value: "bg-chat-light", icon: Sun },
    { name: "Tema Oscuro", value: "bg-chat-dark", icon: Moon },
]

const mapThemes = [
    { name: "Erangel", value: "bg-chat-erangel", icon: Map },
    { name: "Miramar", value: "bg-chat-miramar", icon: Map },
    { name: "Sanhok", value: "bg-chat-sanhok", icon: Map },
    { name: "Vikendi", value: "bg-chat-vikendi", icon: Snowflake },
    { name: "Livik", value: "bg-chat-livik", icon: Map },
    { name: "Rondo", value: "bg-chat-rondo", icon: Map },
]

const skinThemes = [
    { name: "Mosaico de Skins", value: "bg-chat-skin-mosaic", icon: ImageIcon },
    { name: "Camuflaje Digital", value: "bg-chat-camo", icon: Palette },
    { name: "Neon Punk", value: "bg-chat-neon", icon: Flame },
    { name: "Blood Raven", value: "bg-chat-raven", icon: Bot },
]

export function ChatThemeSettings({ children, setTheme, onUploadClick }: ChatThemeSettingsProps) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Fondos de Chat</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuItem onClick={onUploadClick}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Subir Fondo Personalizado</span>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
         <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">General</DropdownMenuLabel>
            {themes.map((theme) => (
                 <DropdownMenuItem key={theme.value} onClick={() => setTheme(theme.value)}>
                    <theme.icon className="mr-2 h-4 w-4" />
                    <span>{theme.name}</span>
                </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Mapas</DropdownMenuLabel>
            {mapThemes.map((theme) => (
                 <DropdownMenuItem key={theme.value} onClick={() => setTheme(theme.value)}>
                    <theme.icon className="mr-2 h-4 w-4" />
                    <span>{theme.name}</span>
                </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
             <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Temas de Skins</DropdownMenuLabel>
            {skinThemes.map((theme) => (
                 <DropdownMenuItem key={theme.value} onClick={() => setTheme(theme.value)}>
                    <theme.icon className="mr-2 h-4 w-4" />
                    <span>{theme.name}</span>
                </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
