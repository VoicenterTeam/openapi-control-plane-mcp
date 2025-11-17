<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <LayoutAppHeader />
    <div class="flex">
      <LayoutAppSidebar />
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Default layout with header and sidebar
</script>

