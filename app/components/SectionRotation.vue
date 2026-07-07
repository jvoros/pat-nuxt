<script setup lang="ts">
import type { Zone } from "../../server/core/types";
const { board } = useBoard();
defineProps<{
    zone?: Zone;
}>();

const open = ref(true);
</script>

<template>
    <UCollapsible v-model:open="open" class="mb-2 md:mb-9">
        <SectionHeader :title="zone.name" icon="lucide:chevrons-up-down" />
        <template #content>
            <template v-for="shiftId in zone.shifts">
                <Shift :shift="board.shifts[shiftId]" />
            </template>
            <div class="mb-4">Lorem ipsum</div>
        </template>
    </UCollapsible>
</template>
