<script setup lang="ts">
import type { Zone } from "../../server/core/types";
const { board } = useBoard();
defineProps<{
    zone?: Zone;
}>();

const open = ref(true);

function headerClick() {
    alert("clicked section-header-action");
}
</script>

<template>
    <UCollapsible v-model:open="open" class="mb-2 md:mb-9">
        <SectionHeader :title="zone.name" icon="lucide:chevrons-up-down" />
        <template #content>
            <div
                v-for="shiftId in zone.shifts"
                class="border-b-1 border-gray-200"
            >
                <div class="text-xs md:text-base">
                    {{ board.shifts[shiftId].name }}
                </div>
                <div class="font-bold">
                    {{ board.shifts[shiftId].first }}
                    {{ board.shifts[shiftId].last }}
                </div>
            </div>
            <div class="mb-4">Lorem ipsum</div>
        </template>
    </UCollapsible>
</template>
