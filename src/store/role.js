// Pinia store - 角色状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRoleStore = defineStore('role', () => {
  const roles = ref([])
  const currentRole = ref(null)
  const loading = ref(false)

  function setRoles(list) {
    roles.value = list
  }

  function setCurrentRole(role) {
    currentRole.value = role
  }

  function setLoading(v) {
    loading.value = v
  }

  return {
    roles,
    currentRole,
    loading,
    setRoles,
    setCurrentRole,
    setLoading
  }
})
