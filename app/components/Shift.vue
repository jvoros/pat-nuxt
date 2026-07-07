<script setup lang="ts">
import type { Shift } from "../../server/core/types";
const { board } = useBoard();
defineProps<{
    shift?: Shift;
}>();
</script>

<template>
    <div class="bg-white dark:bg-neutral-800">
        <div class="uppercase text-sm md:text-base">
            {{ shift.name }}
        </div>
        <div class="font-bold text-lg">
            {{ shift.first }}
            {{ shift.last }}
        </div>
    </div>
</template>
