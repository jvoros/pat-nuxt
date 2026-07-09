<script setup lang="ts">
import type { Zone } from "../../server/core/types";

const { board } = useBoard();

const props = defineProps<{
    zoneSlug: string;
}>();

const zone = computed<Zone | undefined>(
    () => board.value?.zones[props.zoneSlug],
);

const flags = (shiftId: string) => {
    const z = zone.value;
    const s = board.value?.shifts[shiftId];
    if (!z || !s) return null;
    return getShiftFlags(shiftId, z, s);
};

const open = ref(true);
</script>

<template>
    <UCollapsible v-if="zone" v-model:open="open" class="mb-2 md:mb-9">
        <SectionHeader :title="zone.name" icon="lucide:chevrons-up-down" />
        <template #content>
            <template v-for="shiftId in zone.shifts">
                <Shift :shift-id="shiftId" :flags="flags(shiftId)" />
            </template>
        </template>
    </UCollapsible>
</template>
