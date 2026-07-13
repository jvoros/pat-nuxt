<script setup lang="ts">
defineProps<{
    title: string;
}>();
</script>
<template>
    <div class="mb-2 border-b-1 border-muted flex justify-between items-center">
        <h3 class="font-bold md:text-lg uppercase tracking-wider">
            {{ title }}
        </h3>
        <slot name="right"></slot>
    </div>
</template>
