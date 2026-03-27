import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref([])
  const categories = ref([
    '社交', '邮箱', '银行', '开发', '购物', '游戏', '其他'
  ])
  const searchQuery = ref('')
  const selectedCategory = ref('')

  const filteredAccounts = computed(() => {
    let result = accounts.value

    if (selectedCategory.value) {
      result = result.filter(a => a.category === selectedCategory.value)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.username.toLowerCase().includes(query) ||
        (a.url && a.url.toLowerCase().includes(query))
      )
    }

    return result
  })

  function setAccounts(data) {
    if (data.categories) {
      if (data.categories.length > 0 && typeof data.categories[0] === 'string') {
        categories.value = data.categories
      } else {
        categories.value = data.categories.map(cat => cat.name)
      }
    }

    const defaultIconMap = {
      '社交': '👥', '邮箱': '📧', '银行': '🏦',
      '开发': '💻', '购物': '🛒', '游戏': '🎮', '其他': '📁'
    }

    accounts.value = (data.accounts || []).map(acc => {
      if (!acc.icon) {
        if (data.categories && data.categories.length > 0 && typeof data.categories[0] === 'object') {
          const oldCat = data.categories.find(c => c.name === acc.category)
          if (oldCat && oldCat.icon) {
            const vantToEmojiMap = {
              'chat-o': '👥', 'envelop-o': '📧', 'gold-coin-o': '🏦',
              'desktop-o': '💻', 'cart-o': '🛒', 'play-circle-o': '🎮',
              'apps-o': '📁', 'folder-o': '📂', 'apple': '🍎',
              'video-o': '🎥', 'music-o': '🎵', 'photograph': '📷',
              'idcard': '💳', 'smile-o': '😊', 'shop-o': '🏪',
              'bookmark-o': '🔖'
            }
            acc.icon = vantToEmojiMap[oldCat.icon] || oldCat.icon || '📂'
          } else {
            acc.icon = defaultIconMap[acc.category] || '📂'
          }
        } else {
          acc.icon = defaultIconMap[acc.category] || '📂'
        }
      }
      return acc
    })
  }

  function addAccount(account) {
    accounts.value.push(account)
  }

  function updateAccount(id, data) {
    const index = accounts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...data }
    }
  }

  function deleteAccount(id) {
    accounts.value = accounts.value.filter(a => a.id !== id)
  }

  function getAccountById(id) {
    return accounts.value.find(a => a.id === id)
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function setSelectedCategory(category) {
    selectedCategory.value = category
  }

  function addCategory(name) {
    if (name && !categories.value.includes(name)) {
      categories.value.push(name)
      return true
    }
    return false
  }

  function updateCategory(oldName, newName) {
    if (oldName === '其他') return false

    const index = categories.value.indexOf(oldName)
    if (index !== -1) {
      categories.value[index] = newName

      accounts.value.forEach(acc => {
        if (acc.category === oldName) {
          acc.category = newName
        }
      })
      return true
    }
    return false
  }

  function deleteCategory(name) {
    if (name === '其他') return false
    categories.value = categories.value.filter(c => c !== name)
    // 更新属于该分类的账号到“其他”
    accounts.value.forEach(acc => {
      if (acc.category === name) {
        acc.category = '其他'
      }
    })
    return true
  }

  function exportData() {
    return {
      version: 1,
      categories: categories.value,
      accounts: accounts.value
    }
  }

  return {
    accounts,
    categories,
    searchQuery,
    selectedCategory,
    filteredAccounts,
    setAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    setSearchQuery,
    setSelectedCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    exportData
  }
})
