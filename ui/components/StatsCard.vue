<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ title }}</p>
        <p class="text-3xl font-bold mt-2" :class="valueClass">
          {{ value }}
        </p>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div 
        v-if="icon" 
        class="p-3 rounded-full"
        :class="iconBgClass"
      >
        <component :is="iconComponent" class="w-6 h-6" :class="iconClass" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: 'specs' | 'versions' | 'endpoints' | 'schemas' | 'breaking' | 'activity'
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const valueClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'text-voicenter-primary'
    case 'success':
      return 'text-voicenter-success'
    case 'warning':
      return 'text-voicenter-warning'
    case 'danger':
      return 'text-voicenter-destructive'
    default:
      return 'text-gray-900 dark:text-white'
  }
})

const iconBgClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary-100 dark:bg-primary-900'
    case 'success':
      return 'bg-green-100 dark:bg-green-900'
    case 'warning':
      return 'bg-yellow-100 dark:bg-yellow-900'
    case 'danger':
      return 'bg-red-100 dark:bg-red-900'
    default:
      return 'bg-gray-100 dark:bg-gray-700'
  }
})

const iconClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'text-voicenter-primary'
    case 'success':
      return 'text-voicenter-success'
    case 'warning':
      return 'text-voicenter-warning'
    case 'danger':
      return 'text-voicenter-destructive'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
})

const iconComponent = computed(() => {
  return resolveComponent(`Icon${props.icon?.charAt(0).toUpperCase()}${props.icon?.slice(1)}`)
})
</script>

