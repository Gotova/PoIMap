<script setup lang="ts">
defineProps<{
  x_loc: number
  y_loc: number
}>()
</script>

<template>
  <div :style="{'top': y_loc + '%', 'left': x_loc + '%'}">
    <img src="../assets/images/info_marker.png" alt="Info Marker" width="50" />
  </div>
</template>

<style scoped>
</style>
