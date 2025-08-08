
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ExternalLink, Info } from "lucide-react";
import Link from "next/link";

export default function RechargePage() {
    const providers = [
        {
            name: "Midasbuy",
            description: "Plataforma oficial para recargas de UC en juegos populares. Segura y con bonificaciones frecuentes.",
            url: "#", // TODO: Reemplazar con tu link de referido de Midasbuy
            logoUrl: "https://placehold.co/100x40/000000/FFFFFF.png"
        },
        {
            name: "Eneba",
            description: "Marketplace de claves de juegos y tarjetas de regalo donde a menudo se encuentran descuentos para UC.",
            url: "#", // TODO: Reemplazar con tu link de referido de Eneba
            logoUrl: "https://placehold.co/100x40/3c3c3c/FFFFFF.png"
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <DollarSign className="w-8 h-8 text-primary"/>
                    Recargar UC (Unknown Cash)
                </h1>
                <p className="text-muted-foreground">
                    Utiliza nuestros enlaces de afiliados para recargar UC y apoyar el desarrollo de la aplicación.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {providers.map(provider => (
                     <Card key={provider.name}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                               {provider.name}
                               <img src={provider.logoUrl} alt={`${provider.name} logo`} className="h-8 object-contain rounded-md" data-ai-hint="logo"/>
                            </CardTitle>
                            <CardDescription>{provider.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-start p-3 bg-muted/50 rounded-lg text-sm">
                                <Info className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <p className="text-muted-foreground">
                                    Al usar este enlace, realizarás una compra en un sitio externo. Recibimos una pequeña comisión sin costo adicional para ti.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Button asChild className="w-full">
                                <Link href={provider.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ir a {provider.name}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
             <div className="text-center text-muted-foreground text-sm">
                <p>Por favor, asegúrate de que estás en el sitio web correcto antes de realizar cualquier transacción.</p>
                <p>SquadUp: Mobile Battles no se hace responsable de las compras realizadas en sitios de terceros.</p>
            </div>
        </div>
    );
}
