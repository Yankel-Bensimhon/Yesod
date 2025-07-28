'use client'

import { 
  Calendar, 
  User, 
  ArrowRight, 
  Clock, 
  Tag,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', name: 'Tous les articles', count: 12 },
    { id: 'juridique', name: 'Juridique', count: 5 },
    { id: 'recouvrement', name: 'Recouvrement', count: 4 },
    { id: 'entreprise', name: 'Entreprise', count: 2 },
    { id: 'actualites', name: 'Actualités', count: 1 }
  ]

  const featuredArticles = [
    {
      id: 1,
      title: "Réforme de la procédure de recouvrement 2024 : ce qui change",
      excerpt: "Découvrez les principales modifications apportées par la réforme de la procédure civile et leur impact sur le recouvrement de créances.",
      category: "juridique",
      author: "Me. Sophie Dubois",
      date: "2024-01-15",
      readTime: "8 min",
      image: "/api/placeholder/600/400",
      featured: true,
      tags: ["Réforme", "Procédure civile", "2024"]
    },
    {
      id: 2,
      title: "10 erreurs à éviter dans le recouvrement de créances",
      excerpt: "Les erreurs les plus fréquentes commises par les entreprises dans leurs démarches de recouvrement et comment les éviter.",
      category: "recouvrement",
      author: "Jean-Marc Lévy",
      date: "2024-01-10",
      readTime: "6 min",
      image: "/api/placeholder/600/400",
      featured: true,
      tags: ["Bonnes pratiques", "Erreurs courantes"]
    }
  ]

  const articles = [
    {
      id: 3,
      title: "L'injonction de payer dématérialisée : mode d'emploi",
      excerpt: "Tout savoir sur la procédure d'injonction de payer électronique, ses avantages et la marche à suivre.",
      category: "juridique",
      author: "Me. Pierre Martin",
      date: "2024-01-08",
      readTime: "5 min",
      image: "/api/placeholder/400/300",
      tags: ["Injonction", "Dématérialisation"]
    },
    {
      id: 4,
      title: "Recouvrement international : défis et solutions",
      excerpt: "Les spécificités du recouvrement de créances transfrontalier et les outils pour optimiser vos chances de succès.",
      category: "recouvrement",
      author: "Me. Sophie Dubois",
      date: "2024-01-05",
      readTime: "7 min",
      image: "/api/placeholder/400/300",
      tags: ["International", "Export"]
    },
    {
      id: 5,
      title: "Comment améliorer votre trésorerie grâce au recouvrement",
      excerpt: "Stratégies et bonnes pratiques pour optimiser la gestion de vos créances et améliorer votre cash-flow.",
      category: "entreprise",
      author: "Marie Rousseau",
      date: "2024-01-03",
      readTime: "4 min",
      image: "/api/placeholder/400/300",
      tags: ["Trésorerie", "Cash-flow"]
    },
    {
      id: 6,
      title: "Saisie conservatoire : quand et comment l'utiliser",
      excerpt: "Guide pratique sur la saisie conservatoire, mesure préventive essentielle pour sécuriser vos créances.",
      category: "juridique",
      author: "Me. Pierre Martin",
      date: "2023-12-28",
      readTime: "6 min",
      image: "/api/placeholder/400/300",
      tags: ["Saisie", "Procédure"]
    },
    {
      id: 7,
      title: "Digitalisation du recouvrement : tendances 2024",
      excerpt: "Les nouvelles technologies au service du recouvrement de créances et leurs impacts sur l'efficacité.",
      category: "actualites",
      author: "Thomas Bernard",
      date: "2023-12-25",
      readTime: "5 min",
      image: "/api/placeholder/400/300",
      tags: ["Digital", "Innovation"]
    },
    {
      id: 8,
      title: "Négociation amiable : techniques avancées",
      excerpt: "Méthodes éprouvées pour optimiser vos négociations amiables et éviter les procédures judiciaires coûteuses.",
      category: "recouvrement",
      author: "Jean-Marc Lévy",
      date: "2023-12-20",
      readTime: "8 min",
      image: "/api/placeholder/400/300",
      tags: ["Négociation", "Amiable"]
    },
    {
      id: 9,
      title: "Protection des données en recouvrement : guide RGPD",
      excerpt: "Comment concilier efficacité du recouvrement et respect de la réglementation sur la protection des données.",
      category: "juridique",
      author: "Me. Sophie Dubois",
      date: "2023-12-15",
      readTime: "7 min",
      image: "/api/placeholder/400/300",
      tags: ["RGPD", "Protection données"]
    },
    {
      id: 10,
      title: "Recouvrement B2B vs B2C : principales différences",
      excerpt: "Comprendre les spécificités du recouvrement selon que votre débiteur soit un professionnel ou un particulier.",
      category: "recouvrement",
      author: "Marie Rousseau",
      date: "2023-12-10",
      readTime: "6 min",
      image: "/api/placeholder/400/300",
      tags: ["B2B", "B2C"]
    },
    {
      id: 11,
      title: "Prescription des créances commerciales : ce qu'il faut savoir",
      excerpt: "Délais de prescription, interruption et suspension : maîtrisez les règles temporelles du recouvrement.",
      category: "juridique",
      author: "Me. Pierre Martin",
      date: "2023-12-05",
      readTime: "9 min",
      image: "/api/placeholder/400/300",
      tags: ["Prescription", "Délais"]
    },
    {
      id: 12,
      title: "TPE/PME : optimiser sa stratégie de recouvrement",
      excerpt: "Conseils pratiques pour les petites et moyennes entreprises souhaitant structurer leur approche du recouvrement.",
      category: "entreprise",
      author: "Thomas Bernard",
      date: "2023-12-01",
      readTime: "5 min",
      image: "/api/placeholder/400/300",
      tags: ["TPE", "PME", "Stratégie"]
    }
  ]

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      juridique: 'bg-blue-100 text-blue-800',
      recouvrement: 'bg-green-100 text-green-800',
      entreprise: 'bg-purple-100 text-purple-800',
      actualites: 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Blog Yesod
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Expertise juridique, conseils pratiques et actualités 
              du recouvrement de créances
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <BookOpen className="h-5 w-5 mr-2" />
                Derniers articles
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                <MessageSquare className="h-5 w-5 mr-2" />
                Newsletter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
                <span className="ml-2 text-xs opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {selectedCategory === 'all' && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Articles à la une
              </h2>
              <p className="text-xl text-gray-600">
                Nos dernières analyses et conseils d'experts
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <article key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-blue-600" />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                        {categories.find(c => c.id === article.category)?.name}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {article.readTime}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mr-3">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{article.author}</p>
                          <p className="text-sm text-gray-500">{formatDate(article.date)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                        Lire la suite
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles List */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {selectedCategory !== 'all' && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-xl text-gray-600">
                {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} dans cette catégorie
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <article key={article.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {categories.find(c => c.id === article.category)?.name}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {article.readTime}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-2">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{article.author}</p>
                        <p className="text-xs text-gray-500">{formatDate(article.date)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      Lire
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Aucun article dans cette catégorie
              </h3>
              <p className="text-gray-600">
                Revenez bientôt, nous publions régulièrement de nouveaux contenus.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6 mx-auto">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Restez informé
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Recevez nos derniers articles et conseils d'experts directement dans votre boîte mail
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                S'abonner
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Pas de spam, désabonnement facile à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Besoin d'aide pour vos créances ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Notre équipe d'experts est là pour vous accompagner dans toutes vos démarches de recouvrement
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Créer un dossier
              </Button>
            </Link>
            <Link href="/comment-ca-marche">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                Comment ça marche
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
