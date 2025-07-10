import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock } from "lucide-react"
import Image from "next/image"

interface DishCardProps {
  dish: {
    id: string
    originalName: string
    translatedName: string
    price: string
    description: string
    image: string
    tags: string[]
    rating: number
    prepTime: string
    isVegetarian: boolean
    isVegan: boolean
    isGlutenFree: boolean
    spiceLevel: number
  }
}

export function DishCard({ dish }: DishCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Image
          src={dish.image || "/placeholder.svg"}
          alt={dish.translatedName}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-sm font-medium">{dish.price}</div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{dish.translatedName}</h3>
            <p className="text-sm text-gray-500">{dish.originalName}</p>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
            {dish.rating}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3">{dish.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {dish.prepTime}
          </div>
          <div className="flex items-center">
            {"🌶️".repeat(dish.spiceLevel)}
            {dish.spiceLevel === 0 && "😌"}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {dish.isVegetarian && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
              Vegetarian
            </Badge>
          )}
          {dish.isVegan && (
            <Badge variant="outline" className="text-xs text-green-700 border-green-700">
              Vegan
            </Badge>
          )}
          {dish.isGlutenFree && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
              Gluten Free
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
