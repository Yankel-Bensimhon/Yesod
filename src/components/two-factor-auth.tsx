'use client'

import React, { useState, useEffect } from 'react'
import { Smartphone, Shield, Key, AlertCircle, CheckCircle, QrCode, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// =====================================
// TWO-FACTOR AUTHENTICATION SETUP
// =====================================

interface TwoFactorSetupProps {
  userId: string
  onComplete?: () => void
}

export default function TwoFactorAuthSetup({ userId, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState(1)
  const [isEnabled, setIsEnabled] = useState(false)
  const [secret, setSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkTwoFactorStatus()
  }, [userId])

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch(`/api/auth/two-factor/status`)
      if (response.ok) {
        const data = await response.json()
        setIsEnabled(data.isEnabled)
      }
    } catch (error) {
      console.error('Failed to check 2FA status:', error)
    }
  }

  const generateSecret = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/two-factor/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSecret(data.secret)
        setQrCodeUrl(data.qrCodeUrl)
        setBackupCodes(data.backupCodes)
        setStep(2)
      } else {
        setError('Erreur lors de la génération du secret')
      }
    } catch (error) {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          code: verificationCode,
          secret 
        })
      })

      if (response.ok) {
        setIsEnabled(true)
        setStep(3)
        onComplete?.()
      } else {
        setError('Code de vérification incorrect')
      }
    } catch (error) {
      setError('Erreur lors de la vérification')
    } finally {
      setLoading(false)
    }
  }

  const disableTwoFactor = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setIsEnabled(false)
        setStep(1)
        setSecret('')
        setQrCodeUrl('')
        setBackupCodes([])
      }
    } catch (error) {
      setError('Erreur lors de la désactivation')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isEnabled && step !== 3) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Authentification à Deux Facteurs Activée</h3>
          <p className="text-sm text-gray-600 mt-2">
            Votre compte est protégé par l&apos;authentification à deux facteurs
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-900">Protection Active</h4>
              <p className="text-sm text-green-700">
                Votre compte nécessite un code de votre application d&apos;authentification
              </p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={disableTwoFactor}
          disabled={loading}
          className="w-full text-red-600 border-red-300 hover:bg-red-50"
        >
          Désactiver l&apos;authentification à deux facteurs
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
      {/* Step 1: Introduction */}
      {step === 1 && (
        <div>
          <div className="text-center mb-6">
            <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Configurer l&apos;Authentification à Deux Facteurs</h3>
            <p className="text-sm text-gray-600 mt-2">
              Ajoutez une couche de sécurité supplémentaire à votre compte
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Sécurité renforcée</h4>
                <p className="text-sm text-gray-600">Protection contre les accès non autorisés</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Key className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Codes uniques</h4>
                <p className="text-sm text-gray-600">Génération de codes temporaires depuis votre téléphone</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Application requise</h4>
                <p className="text-sm text-yellow-700">
                  Vous aurez besoin d&apos;une application comme Google Authenticator ou Authy
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={generateSecret}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Configuration...' : 'Commencer la configuration'}
          </Button>
        </div>
      )}

      {/* Step 2: QR Code Scan */}
      {step === 2 && (
        <div>
          <div className="text-center mb-6">
            <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Scanner le Code QR</h3>
            <p className="text-sm text-gray-600 mt-2">
              Utilisez votre application d&apos;authentification pour scanner ce code
            </p>
          </div>

          {/* QR Code placeholder */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Code QR</p>
              <p className="text-xs text-gray-400 mt-1">
                (En production, intégrer une vraie bibliothèque QR)
              </p>
            </div>
          </div>

          {/* Manual entry option */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Ou saisissez manuellement :</h4>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-100 text-sm px-3 py-2 rounded border">
                {secret}
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(secret)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Verification */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification (6 chiffres)
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setVerificationCode(value)
                }}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                {error}
              </div>
            )}

            <Button 
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="w-full"
            >
              {loading ? 'Vérification...' : 'Vérifier et activer'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success & Backup Codes */}
      {step === 3 && (
        <div>
          <div className="text-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Authentification à Deux Facteurs Activée</h3>
            <p className="text-sm text-gray-600 mt-2">
              Votre compte est maintenant protégé
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Codes de Récupération</h4>
            <p className="text-sm text-yellow-700 mb-3">
              Conservez ces codes en lieu sûr. Ils vous permettront d&apos;accéder à votre compte si vous perdez votre téléphone.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  {code}
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 w-full"
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier les codes
            </Button>
          </div>

          <Button onClick={onComplete} className="w-full">
            Terminé
          </Button>
        </div>
      )}
    </div>
  )
}

// =====================================
// 2FA LOGIN COMPONENT
// =====================================

interface TwoFactorLoginProps {
  onVerified: () => void
  onCancel: () => void
}

export function TwoFactorLogin({ onVerified, onCancel }: TwoFactorLoginProps) {
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (code.length < 6) {
      setError('Code incomplet')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/two-factor/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          isBackupCode: useBackupCode 
        })
      })

      if (response.ok) {
        onVerified()
      } else {
        setError('Code incorrect')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Vérification à Deux Facteurs</h3>
        <p className="text-sm text-gray-600 mt-2">
          Saisissez le code de votre application d&apos;authentification
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {useBackupCode ? 'Code de récupération' : 'Code d\'authentification'}
          </label>
          <Input
            type="text"
            placeholder={useBackupCode ? "XXXXXXXX" : "123456"}
            value={code}
            onChange={(e) => {
              const value = useBackupCode 
                ? e.target.value.toUpperCase().slice(0, 8)
                : e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(value)
            }}
            maxLength={useBackupCode ? 8 : 6}
            className="text-center text-lg tracking-widest"
            autoComplete="one-time-code"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            type="submit"
            disabled={loading || code.length < (useBackupCode ? 8 : 6)}
            className="w-full"
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </Button>

          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              setUseBackupCode(!useBackupCode)
              setCode('')
              setError('')
            }}
            className="w-full"
          >
            {useBackupCode ? 'Utiliser le code d\'authentification' : 'Utiliser un code de récupération'}
          </Button>

          <Button 
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full text-gray-600"
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}
