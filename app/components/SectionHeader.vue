<script setup lang="ts">
defineProps<{
    title?: string;
    icon?: string;
}>();

defineEmits(["section-header-action"]);
</script>
<template>
    <UTooltip text="click to collapse">
        <div
            class="border-b-1 border-gray-200 flex justify-between items-center cursor-pointer"
        >
            <h3 class="font-bold md:text-lg uppercase tracking-wider">
                {{ title }}
            </h3>
            <UIcon v-if="icon" :name="icon" class="size-4" />
        </div>
    </UTooltip>
</template>
