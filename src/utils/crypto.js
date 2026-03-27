const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 100000

async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(data, password) {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const key = await deriveKey(password, salt)
  const encodedData = encoder.encode(JSON.stringify(data))

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedData
  )

  const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength)
  result.set(salt, 0)
  result.set(iv, salt.length)
  result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length)

  return btoa(String.fromCharCode(...result))
}

export async function decrypt(encryptedBase64, password) {
  try {
    const encryptedArray = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))

    const salt = encryptedArray.slice(0, 16)
    const iv = encryptedArray.slice(16, 28)
    const data = encryptedArray.slice(28)

    const key = await deriveKey(password, salt)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    )

    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decryptedBuffer))
  } catch (error) {
    throw new Error('解密失败，请检查主密码是否正确')
  }
}

export function generatePassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options

  let chars = ''
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (numbers) chars += '0123456789'
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'

  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

export function checkPasswordStrength(password) {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return { level: 'weak', text: '弱', color: '#ff4444' }
  if (score <= 4) return { level: 'medium', text: '中', color: '#ffaa00' }
  if (score <= 5) return { level: 'strong', text: '强', color: '#00cc44' }
  return { level: 'very-strong', text: '非常强', color: '#00ff88' }
}
