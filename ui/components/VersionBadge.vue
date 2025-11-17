<template>
  <span 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClass"
  >
    {{ version }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  version: string
  current?: boolean
  stable?: boolean
}

const props = defineProps<Props>()

const badgeClass = computed(() => {
  if (props.current) {
    return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
  }
  if (props.stable) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
})
</script>

