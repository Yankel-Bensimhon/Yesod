'use client'

import { useState } from 'react'

interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  category: string
  readTime: string
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Comment optimiser votre processus de recouvrement",
    excerpt: "Découvrez les meilleures pratiques pour améliorer l&apos;efficacité de votre recouvrement de créances.",
    content: "Le recouvrement de créances est un processus complexe qui nécessite une approche méthodique...",
    author: "Équipe Yesod",
    date: "2024-01-15",
    category: "Conseils",
    readTime: "5 min"
  },
  {
    id: 2,
    title: "Les nouvelles réglementations en matière de recouvrement",
    excerpt: "Restez informé des dernières évolutions légales qui impactent votre activité de recouvrement.",
    content: "Le cadre réglementaire du recouvrement évolue constamment...",
    author: "Expert Juridique",
    date: "2024-01-10",
    category: "Juridique",
    readTime: "7 min"
  },
  {
    id: 3,
    title: "Digitalisation du recouvrement : les avantages",
    excerpt: "Comment la technologie révolutionne le secteur du recouvrement de créances.",
    content: "La transformation digitale offre de nombreuses opportunités...",
    author: "Tech Team",
    date: "2024-01-05",
    category: "Technologie",
    readTime: "6 min"
  },
  {
    id: 4,
    title: "Gestion de la relation client pendant le recouvrement",
    excerpt: "Maintenir de bonnes relations tout en récupérant vos créances.",
    content: "L&apos;art du recouvrement réside dans l&apos;équilibre entre fermeté et diplomatie...",
    author: "Relation Client",
    date: "2023-12-28",
    category: "Conseils",
    readTime: "4 min"
  }
]

const categories = ["Tous", "Conseils", "Juridique", "Technologie"]

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "Tous" || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/32494950/pexels-photo-32494950/free-photo-of-cour-du-musee-du-louvre-et-pyramide-de-verre-la-nuit.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')"
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        
        {/* Header Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              Blog Yesod
            </h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto drop-shadow-md">
              Découvrez nos conseils d&apos;experts, les dernières actualités juridiques 
              et les innovations dans le domaine du recouvrement de créances.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-500">
                      <p className="font-medium">{post.author}</p>
                      <p>{new Date(post.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Lire la suite →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun article trouvé pour votre recherche.
            </p>
          </div>
        )}

        {/* Newsletter Subscription */}
        <div className="mt-16 bg-blue-600 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Restez informé de nos dernières actualités
          </h3>
          <p className="text-blue-100 mb-6">
            Abonnez-vous à notre newsletter pour recevoir nos conseils d&apos;experts 
            et les dernières nouvelles du secteur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              S&apos;abonner
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
