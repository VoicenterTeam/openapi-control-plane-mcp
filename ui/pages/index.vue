<template>
  <div>
    <!-- Page Title -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Overview of your OpenAPI specifications and recent activity
      </p>
    </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-voicenter-primary"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- Dashboard Content -->
        <div v-else-if="stats">
          <!-- Stats Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Specs" 
              :value="stats.total_specs"
              variant="primary"
              subtitle="API Specifications"
            />
            <StatsCard 
              title="Total Versions" 
              :value="stats.total_versions"
              subtitle="Across all specs"
            />
            <StatsCard 
              title="Endpoints" 
              :value="stats.total_endpoints"
              subtitle="Total API endpoints"
            />
            <StatsCard 
              title="This Week" 
              :value="stats.versions_this_week"
              variant="success"
              subtitle="New versions"
            />
          </div>

          <!-- Charts Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Specs by Tag Pie Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specs by Tag</h2>
              <VChart 
                v-if="specsByTagChartData.length > 0"
                :option="specsByTagChartOption" 
                :style="{ height: '300px' }"
                autoresize
              />
              <p v-else class="text-gray-500 dark:text-gray-400 text-center py-12">
                No tagged specs available
              </p>
            </div>

            <!-- Recent Activity Timeline -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
              <VChart 
                v-if="recentActivityChartData.length > 0"
                :option="recentActivityChartOption" 
                :style="{ height: '300px' }"
                autoresize
              />
              <p v-else class="text-gray-500 dark:text-gray-400 text-center py-12">
                No recent activity
              </p>
            </div>
          </div>

          <!-- Breaking Changes Alert -->
          <div v-if="stats.breaking_changes_count > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p class="font-medium text-red-800 dark:text-red-200">Breaking Changes Detected</p>
                <p class="text-sm text-red-700 dark:text-red-300">
                  {{ stats.breaking_changes_count }} spec(s) have breaking changes
                </p>
              </div>
            </div>
          </div>

          <!-- Recent Changes List -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Changes</h2>
            </div>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div 
                v-for="(change, index) in stats.recent_changes.slice(0, 10)" 
                :key="index"
                class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ change.event }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ change.api_id }} 
                      <span v-if="change.version" class="ml-2">
                        <VersionBadge :version="change.version" />
                      </span>
                    </p>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(change.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

// Register ECharts components
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const { stats, loading, error, fetchStats, specsByTagChartData, recentChangesChartData } = useDashboardStats()

// Fetch data on mount
onMounted(() => {
  fetchStats()
})

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// Specs by Tag Pie Chart Option
const specsByTagChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
  },
  series: [
    {
      name: 'Specs',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
        position: 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold',
        },
      },
      labelLine: {
        show: false,
      },
      data: specsByTagChartData.value,
      color: ['#F52222', '#750B0B', '#3DAF7A', '#F9C74F', '#CC2929'],
    },
  ],
}))

// Recent Activity Chart Option
const recentActivityChartData = computed(() => {
  if (!stats.value?.recent_changes) return []
  
  // Group by date
  const grouped: Record<string, number> = {}
  stats.value.recent_changes.forEach(change => {
    const date = new Date(change.timestamp).toLocaleDateString()
    grouped[date] = (grouped[date] || 0) + 1
  })
  
  return Object.entries(grouped).map(([date, count]) => ({ date, count })).slice(0, 7).reverse()
})

const recentActivityChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: recentActivityChartData.value.map(d => d.date),
    axisLine: {
      lineStyle: {
        color: '#999',
      },
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#999',
      },
    },
  },
  series: [
    {
      data: recentActivityChartData.value.map(d => d.count),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(245, 34, 34, 0.1)',
      },
      lineStyle: {
        color: '#F52222',
        width: 2,
      },
      itemStyle: {
        color: '#F52222',
      },
    },
  ],
}))

useHead({
  title: 'Dashboard',
})
</script>

