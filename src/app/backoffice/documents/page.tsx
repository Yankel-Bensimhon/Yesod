'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { 
  FileText,
  Folder,
  Upload,
  Search,
  Filter,
  Download,
  Share,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Star,
  Lock,
  Calendar,
  User,
  Building2,
  Tag,
  Archive,
  Paperclip,
  Image,
  FileSpreadsheet,
  FileVideo,
  File,
  Plus,
  FolderPlus,
  CloudUpload,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: 'pdf' | 'doc' | 'docx' | 'txt' | 'jpg' | 'png' | 'xlsx' | 'mp4' | 'other'
  size: number
  path: string
  folderId?: string
  clientId?: string
  caseId?: string
  uploadedBy: string
  uploadedAt: string
  lastModified: string
  version: number
  status: 'active' | 'archived' | 'deleted'
  accessLevel: 'public' | 'private' | 'restricted'
  tags: string[]
  description?: string
  isStarred: boolean
  isLocked: boolean
  checksum: string
  downloads: number
  views: number
}

interface Folder {
  id: string
  name: string
  parentId?: string
  path: string
  clientId?: string
  caseId?: string
  createdBy: string
  createdAt: string
  documentCount: number
  folderCount: number
  accessLevel: 'public' | 'private' | 'restricted'
  color?: string
}

interface DocumentStats {
  totalDocuments: number
  totalSize: number
  documentsThisMonth: number
  folders: number
  starredDocuments: number
  recentViews: number
  pendingReview: number
  archivedDocuments: number
}

export default function DocumentManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([])
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    totalDocuments: 0,
    totalSize: 0,
    documentsThisMonth: 0,
    folders: 0,
    starredDocuments: 0,
    recentViews: 0,
    pendingReview: 0,
    archivedDocuments: 0
  })
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [sortBy, setSortBy] = useState('recent')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation de données pour la démonstration
    setTimeout(() => {
      const mockFolders: Folder[] = [
        {
          id: '1',
          name: 'Dossiers Clients',
          path: '/dossiers-clients',
          createdBy: 'Yankel Bensimhon',
          createdAt: '2024-01-15',
          documentCount: 45,
          folderCount: 8,
          accessLevel: 'private',
          color: 'blue'
        },
        {
          id: '2',
          name: 'TECHNO SAS',
          parentId: '1',
          path: '/dossiers-clients/techno-sas',
          clientId: '1',
          createdBy: 'Yankel Bensimhon',
          createdAt: '2024-01-15',
          documentCount: 12,
          folderCount: 3,
          accessLevel: 'restricted',
          color: 'green'
        },
        {
          id: '3',
          name: 'Contentieux Commercial',
          parentId: '2',
          path: '/dossiers-clients/techno-sas/contentieux',
          clientId: '1',
          caseId: '1',
          createdBy: 'Yankel Bensimhon',
          createdAt: '2024-01-15',
          documentCount: 8,
          folderCount: 0,
          accessLevel: 'restricted'
        },
        {
          id: '4',
          name: 'Modèles & Templates',
          path: '/modeles',
          createdBy: 'Yankel Bensimhon',
          createdAt: '2024-01-01',
          documentCount: 23,
          folderCount: 4,
          accessLevel: 'public',
          color: 'purple'
        },
        {
          id: '5',
          name: 'Documents Administratifs',
          path: '/administratif',
          createdBy: 'Yankel Bensimhon',
          createdAt: '2024-01-01',
          documentCount: 15,
          folderCount: 2,
          accessLevel: 'private',
          color: 'orange'
        }
      ]

      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Assignation TECHNO vs SUPPLIER.pdf',
          type: 'pdf',
          size: 2840576,
          path: '/dossiers-clients/techno-sas/contentieux/assignation.pdf',
          folderId: '3',
          clientId: '1',
          caseId: '1',
          uploadedBy: 'Yankel Bensimhon',
          uploadedAt: '2025-01-15',
          lastModified: '2025-01-20',
          version: 2,
          status: 'active',
          accessLevel: 'restricted',
          tags: ['Contentieux', 'Assignation', 'Urgent'],
          description: 'Assignation en rupture de contrat commercial',
          isStarred: true,
          isLocked: true,
          checksum: 'sha256:abc123...',
          downloads: 5,
          views: 12
        },
        {
          id: '2',
          name: 'Contrat Commercial TECHNO-SUPPLIER.pdf',
          type: 'pdf',
          size: 1920384,
          path: '/dossiers-clients/techno-sas/contentieux/contrat.pdf',
          folderId: '3',
          clientId: '1',
          caseId: '1',
          uploadedBy: 'Yankel Bensimhon',
          uploadedAt: '2025-01-12',
          lastModified: '2025-01-12',
          version: 1,
          status: 'active',
          accessLevel: 'restricted',
          tags: ['Contrat', 'Commercial', 'Pièce'],
          description: 'Contrat commercial original signé',
          isStarred: false,
          isLocked: false,
          checksum: 'sha256:def456...',
          downloads: 3,
          views: 8
        },
        {
          id: '3',
          name: 'Correspondance avec adversaire.docx',
          type: 'docx',
          size: 245760,
          path: '/dossiers-clients/techno-sas/contentieux/correspondance.docx',
          folderId: '3',
          clientId: '1',
          caseId: '1',
          uploadedBy: 'Yankel Bensimhon',
          uploadedAt: '2025-01-18',
          lastModified: '2025-01-25',
          version: 3,
          status: 'active',
          accessLevel: 'restricted',
          tags: ['Correspondance', 'Négociation'],
          description: 'Échanges avec conseil adverse',
          isStarred: false,
          isLocked: false,
          checksum: 'sha256:ghi789...',
          downloads: 2,
          views: 6
        },
        {
          id: '4',
          name: 'Template Mise en demeure.docx',
          type: 'docx',
          size: 156672,
          path: '/modeles/contentieux/mise-en-demeure.docx',
          folderId: '4',
          uploadedBy: 'Yankel Bensimhon',
          uploadedAt: '2024-12-01',
          lastModified: '2025-01-10',
          version: 4,
          status: 'active',
          accessLevel: 'public',
          tags: ['Template', 'Mise en demeure', 'Recouvrement'],
          description: 'Modèle de mise en demeure réutilisable',
          isStarred: true,
          isLocked: false,
          checksum: 'sha256:jkl012...',
          downloads: 15,
          views: 45
        },
        {
          id: '5',
          name: 'Facture Cabinet janvier 2025.xlsx',
          type: 'xlsx',
          size: 487424,
          path: '/administratif/facturation/janvier-2025.xlsx',
          folderId: '5',
          uploadedBy: 'Assistant Cabinet',
          uploadedAt: '2025-01-28',
          lastModified: '2025-01-28',
          version: 1,
          status: 'active',
          accessLevel: 'private',
          tags: ['Facturation', 'Janvier', 'Comptabilité'],
          description: 'Suivi facturation mensuelle',
          isStarred: false,
          isLocked: false,
          checksum: 'sha256:mno345...',
          downloads: 1,
          views: 3
        },
        {
          id: '6',
          name: 'Convention honoraires INNOV SA.pdf',
          type: 'pdf',
          size: 892928,
          path: '/dossiers-clients/innov-sa/convention.pdf',
          clientId: '2',
          uploadedBy: 'Yankel Bensimhon',
          uploadedAt: '2025-01-20',
          lastModified: '2025-01-22',
          version: 2,
          status: 'active',
          accessLevel: 'restricted',
          tags: ['Convention', 'Honoraires', 'M&A'],
          description: 'Convention d&apos;honoraires pour mission M&A',
          isStarred: false,
          isLocked: true,
          checksum: 'sha256:pqr678...',
          downloads: 2,
          views: 4
        }
      ]

      setFolders(mockFolders)
      setDocuments(mockDocuments)
      setFilteredFolders(mockFolders)
      setFilteredDocuments(mockDocuments)

      // Calcul des statistiques
      const totalSize = mockDocuments.reduce((sum, doc) => sum + doc.size, 0)
      const documentsThisMonth = mockDocuments.filter(doc => 
        new Date(doc.uploadedAt).getMonth() === new Date().getMonth()
      ).length
      const starredCount = mockDocuments.filter(doc => doc.isStarred).length
      const recentViews = mockDocuments.reduce((sum, doc) => sum + doc.views, 0)

      setDocumentStats({
        totalDocuments: mockDocuments.length,
        totalSize,
        documentsThisMonth,
        folders: mockFolders.length,
        starredDocuments: starredCount,
        recentViews,
        pendingReview: 3,
        archivedDocuments: 8
      })

      setLoading(false)
    }, 1000)
  }, [session, status, router])

  // Filtrage et recherche
  useEffect(() => {
    let filteredDocs = [...documents]
    let filteredFolds = [...folders]

    // Filtre par dossier actuel
    if (currentFolder) {
      filteredDocs = filteredDocs.filter(doc => doc.folderId === currentFolder)
      filteredFolds = filteredFolds.filter(folder => folder.parentId === currentFolder)
    } else {
      filteredFolds = filteredFolds.filter(folder => !folder.parentId)
    }

    // Filtre par type
    if (filterType !== 'tous') {
      if (filterType === 'dossiers') {
        filteredDocs = []
      } else {
        filteredDocs = filteredDocs.filter(doc => doc.type === filterType)
        filteredFolds = []
      }
    }

    // Recherche
    if (searchTerm) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      filteredFolds = filteredFolds.filter(folder =>
        folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Tri
    filteredDocs.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'recent':
          comparison = new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = b.size - a.size
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'desc' ? comparison : -comparison
    })

    setFilteredDocuments(filteredDocs)
    setFilteredFolders(filteredFolds)
  }, [documents, folders, currentFolder, filterType, searchTerm, sortBy, sortOrder])

  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-600" />
      case 'doc':
      case 'docx': return <FileText className="h-5 w-5 text-blue-600" />
      case 'xlsx': return <FileSpreadsheet className="h-5 w-5 text-green-600" />
      case 'jpg':
      case 'png': return <Image className="h-5 w-5 text-purple-600" />
      case 'mp4': return <FileVideo className="h-5 w-5 text-orange-600" />
      default: return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getAccessLevelColor = (level: Document['accessLevel'] | Folder['accessLevel']) => {
    switch (level) {
      case 'public': return 'text-green-600'
      case 'private': return 'text-blue-600'
      case 'restricted': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getAccessLevelIcon = (level: Document['accessLevel'] | Folder['accessLevel']) => {
    switch (level) {
      case 'public': return <Eye className="h-4 w-4" />
      case 'private': return <Lock className="h-4 w-4" />
      case 'restricted': return <Shield className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getCurrentFolderPath = () => {
    if (!currentFolder) return 'Racine'
    const folder = folders.find(f => f.id === currentFolder)
    return folder ? folder.path : 'Racine'
  }

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId)
  }

  const navigateUp = () => {
    if (!currentFolder) return
    const currentFolderObj = folders.find(f => f.id === currentFolder)
    if (currentFolderObj?.parentId) {
      setCurrentFolder(currentFolderObj.parentId)
    } else {
      setCurrentFolder(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la bibliothèque documentaire...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion Documentaire</h1>
              <p className="text-gray-600 mt-1">
                Bibliothèque des documents et dossiers du cabinet
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Télécharger sélection
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Nouveau dossier
              </Button>
              <Button className="flex items-center gap-2">
                <CloudUpload className="h-4 w-4" />
                Importer documents
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques documentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total documents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documentStats.totalDocuments}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Upload className="h-4 w-4 mr-1" />
                  {documentStats.documentsThisMonth} ce mois
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Espace utilisé</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(documentStats.totalSize)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <Archive className="h-4 w-4 mr-1" />
                  {documentStats.folders} dossiers
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Folder className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoris</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documentStats.starredDocuments}
                </p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <Star className="h-4 w-4 mr-1" />
                  Documents étoilés
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activité</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documentStats.recentViews}
                </p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Vues totales
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation et contrôles */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <button
              onClick={() => navigateToFolder(null)}
              className="hover:text-blue-600"
            >
              Racine
            </button>
            {currentFolder && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {getCurrentFolderPath().split('/').pop()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateUp}
                  className="ml-2"
                >
                  ← Retour
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            
            {/* Recherche et filtres */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Rechercher documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tous">Tous les types</option>
                <option value="dossiers">Dossiers uniquement</option>
                <option value="pdf">PDF</option>
                <option value="doc">Word</option>
                <option value="docx">Word (nouveau)</option>
                <option value="xlsx">Excel</option>
                <option value="jpg">Images</option>
                <option value="png">Images</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Plus récent</option>
                <option value="name">Nom</option>
                <option value="size">Taille</option>
                <option value="type">Type</option>
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            {/* Contrôles de vue */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-xl shadow-sm border">
          
          {/* Header du tableau */}
          {viewMode === 'list' && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-5">Nom</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1">Taille</div>
                <div className="col-span-2">Modifié</div>
                <div className="col-span-1">Accès</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
          )}

          {/* Liste des dossiers */}
          {filteredFolders.length > 0 && (
            <div className="divide-y divide-gray-200">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToFolder(folder.id)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5 flex items-center gap-3">
                      <Folder className={`h-5 w-5 text-${folder.color || 'blue'}-600`} />
                      <div>
                        <p className="font-medium text-gray-900">{folder.name}</p>
                        <p className="text-sm text-gray-500">
                          {folder.documentCount} document{folder.documentCount > 1 ? 's' : ''} • {folder.folderCount} dossier{folder.folderCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">Dossier</div>
                    <div className="col-span-1 text-sm text-gray-500">—</div>
                    <div className="col-span-2 text-sm text-gray-500">
                      {new Date(folder.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <div className={`col-span-1 flex items-center gap-1 text-sm ${getAccessLevelColor(folder.accessLevel)}`}>
                      {getAccessLevelIcon(folder.accessLevel)}
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Liste des documents */}
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(document.type)}
                      {document.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      {document.isLocked && <Lock className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{document.name}</p>
                      {document.description && (
                        <p className="text-sm text-gray-500 truncate">{document.description}</p>
                      )}
                      {document.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {document.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="inline-flex px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                          {document.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{document.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-500 uppercase">
                    {document.type}
                    {document.version > 1 && (
                      <span className="ml-1 text-blue-600">v{document.version}</span>
                    )}
                  </div>
                  <div className="col-span-1 text-sm text-gray-500">
                    {formatFileSize(document.size)}
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">
                    <div>{new Date(document.lastModified).toLocaleDateString('fr-FR')}</div>
                    <div className="text-xs text-gray-400">par {document.uploadedBy}</div>
                  </div>
                  <div className={`col-span-1 flex items-center gap-1 text-sm ${getAccessLevelColor(document.accessLevel)}`}>
                    {getAccessLevelIcon(document.accessLevel)}
                  </div>
                  <div className="col-span-1 flex items-center gap-1">
                    <Button variant="ghost" size="sm" title="Aperçu">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Télécharger">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Plus d&apos;actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message si aucun résultat */}
          {filteredDocuments.length === 0 && filteredFolders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== 'tous' 
                  ? 'Aucun document ne correspond à vos critères de recherche.'
                  : 'Ce dossier est vide. Commencez par importer des documents.'
                }
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Importer des documents
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
