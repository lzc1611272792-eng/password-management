import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const masterPassword = ref('')
  const gistId = ref('')

  const isAuthenticated = computed(() => !!token.value && !!masterPassword.value)

  function setToken(newToken) {
    token.value = newToken
  }

  function setMasterPassword(password) {
    masterPassword.value = password
  }

  function setGistId(id) {
    gistId.value = id
  }

  function logout() {
    token.value = ''
    masterPassword.value = ''
    gistId.value = ''
    localStorage.removeItem('pm_token')
    localStorage.removeItem('pm_gist_id')
    localStorage.removeItem('pm_master_password')
    localStorage.removeItem('pm_password_saved_at')
  }

  function loadFromStorage() {
    const savedToken = localStorage.getItem('pm_token')
    const savedGistId = localStorage.getItem('pm_gist_id')
    const savedPassword = localStorage.getItem('pm_master_password')
    const savedAt = localStorage.getItem('pm_password_saved_at')

    if (savedToken) token.value = savedToken
    if (savedGistId) gistId.value = savedGistId
    
    // 检查主密码有效期 (3天)
    if (savedPassword && savedAt) {
      const now = Date.now()
      const expiry = 3 * 24 * 60 * 60 * 1000 // 3天
      if (now - parseInt(savedAt) < expiry) {
        masterPassword.value = savedPassword
      } else {
        // 已过期，清理
        localStorage.removeItem('pm_master_password')
        localStorage.removeItem('pm_password_saved_at')
      }
    }
  }

  function saveToStorage() {
    localStorage.setItem('pm_token', token.value)
    localStorage.setItem('pm_gist_id', gistId.value)
    if (masterPassword.value) {
      localStorage.setItem('pm_master_password', masterPassword.value)
      localStorage.setItem('pm_password_saved_at', Date.now().toString())
    }
  }

  return {
    token,
    masterPassword,
    gistId,
    isAuthenticated,
    setToken,
    setMasterPassword,
    setGistId,
    logout,
    loadFromStorage,
    saveToStorage
  }
})
