
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M21.35 11.1h-9.2v2.7h5.3c-.2 1.1-.9 2-2.1 2.7v1.8h2.3c1.3-1.2 2.1-3 2.1-5.1 0-.6-.1-1.1-.2-1.6z"></path>
        <path fill="#34A853" d="M12.15 21.3c2.5 0 4.6-.8 6.1-2.2l-2.3-1.8c-.8.6-1.9.9-3.2.9-2.5 0-4.6-1.7-5.3-4H4.2v1.8c1.5 2.9 4.3 4.9 7.95 4.9z"></path>
        <path fill="#FBBC05" d="M6.85 14.1c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V8.7H4.2c-.7 1.4-1.1 3-1.1 4.6s.4 3.2 1.1 4.6l2.65-1.8z"></path>
        <path fill="#EA4335" d="M12.15 6.6c1.3 0 2.4.5 3.2 1.2l2-2c-1.8-1.7-4.1-2.6-6.6-2.6-3.65 0-6.45 2-7.95 4.9l2.65 1.8c.7-2.3 2.8-4 5.3-4z"></path>
        <path fill="none" d="M0 0h24v24H0z"></path>
    </svg>
);

const FacebookIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
    </svg>
);
const TwitterIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#1DA1F2">
        <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.39.106-.803.163-1.227.163-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path>
    </svg>
);


export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [country, setCountry] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleAuthAction = async (action: "login" | "register") => {
    setError(null)
    if (action === 'register' && !country) {
      setError("Por favor, selecciona tu país de origen.");
      return;
    }
    try {
      if (action === "login") {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      toast({ title: action === 'login' ? 'Inicio de Sesión Exitoso' : 'Registro Exitoso', description: '¡Bienvenido a SquadUp!' })
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    }
  }
  
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
      setError(null);
      let authProvider;

      if (provider === 'google') authProvider = new GoogleAuthProvider();
      if (provider === 'facebook') authProvider = new FacebookAuthProvider();
      if (provider === 'twitter') authProvider = new TwitterAuthProvider();

      if (!authProvider) return;

      try {
          await signInWithPopup(auth, authProvider);
          toast({ title: 'Inicio de Sesión Exitoso', description: '¡Bienvenido a SquadUp!' });
          router.push('/dashboard');
      } catch (err: any) {
          setError(err.message);
      }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="register">Registrarse</TabsTrigger>
        </TabsList>

        <div className="pt-4 pb-4 text-center">
            <p className="text-sm text-muted-foreground">O inicia sesión con</p>
            <div className="flex justify-center gap-4 mt-2">
                <Button variant="outline" onClick={() => handleSocialLogin('google')}><GoogleIcon /> Google</Button>
                <Button variant="outline" onClick={() => handleSocialLogin('facebook')}><FacebookIcon /> Facebook</Button>
                <Button variant="outline" onClick={() => handleSocialLogin('twitter')}><TwitterIcon /> Twitter</Button>
            </div>
             <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>
        </div>

        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa tu correo electrónico y contraseña para acceder a tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Correo Electrónico</Label>
                <Input id="login-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input id="login-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAuthAction("login")}>Iniciar Sesión</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Registrarse</CardTitle>
              <CardDescription>
                Crea una nueva cuenta para empezar a conectar con jugadores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Correo Electrónico</Label>
                <Input id="register-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Contraseña</Label>
                <Input id="register-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-country">País</Label>
                 <Select onValueChange={setCountry} value={country}>
                    <SelectTrigger id="register-country">
                        <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AR">Argentina</SelectItem>
                        <SelectItem value="BO">Bolivia</SelectItem>
                        <SelectItem value="BR">Brasil</SelectItem>
                        <SelectItem value="CA">Canadá</SelectItem>
                        <SelectItem value="CL">Chile</SelectItem>
                        <SelectItem value="CO">Colombia</SelectItem>
                        <SelectItem value="CR">Costa Rica</SelectItem>
                        <SelectItem value="EC">Ecuador</SelectItem>
                        <SelectItem value="SV">El Salvador</SelectItem>
                        <SelectItem value="US">Estados Unidos</SelectItem>
                        <SelectItem value="GT">Guatemala</SelectItem>
                        <SelectItem value="HN">Honduras</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                        <SelectItem value="PA">Panamá</SelectItem>
                        <SelectItem value="PY">Paraguay</SelectItem>
                        <SelectItem value="PE">Perú</SelectItem>
                        <SelectItem value="PR">Puerto Rico</SelectItem>
                        <SelectItem value="DO">República Dominicana</SelectItem>
                        <SelectItem value="UY">Uruguay</SelectItem>
                        <SelectItem value="VE">Venezuela</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAuthAction("register")}>Crear Cuenta</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {error && (
            <Alert variant="destructive" className="mt-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error de Autenticación</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </Tabs>
    </div>
  )
}
