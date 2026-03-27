import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref([])
  const categories = ref(['社交', '邮箱', '银行', '开发', '购物', '游戏', '其他'])
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
    accounts.value = data.accounts || []
    if (data.categories) {
      categories.value = data.categories
    }
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
    exportData
  }
})
