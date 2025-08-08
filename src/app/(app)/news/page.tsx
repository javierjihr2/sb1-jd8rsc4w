
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { newsArticles } from "@/lib/data"
import { Button } from "@/components/ui/button"

export default function NewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Noticias y Actualizaciones</h1>
        <p className="text-muted-foreground">Mantente al día con lo último del universo PUBG Mobile.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {newsArticles.map((article) => (
          <Card key={article.id} className="flex flex-col">
            <CardHeader className="p-0">
               <Image
                src={article.imageUrl}
                alt={article.title}
                width={600}
                height={400}
                className="rounded-t-lg object-cover aspect-video"
                data-ai-hint="gaming news"
              />
            </CardHeader>
            <CardContent className="p-6 flex-1">
                <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
                <CardDescription>{article.summary}</CardDescription>
            </CardContent>
            <CardFooter className="p-6 pt-0">
                 <Button variant="outline">Leer más</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
