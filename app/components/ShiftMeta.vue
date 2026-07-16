<script setup lang="ts">
import type { Shift } from "../../server/core/types";
const props = defineProps<{
    shift: Shift;
}>();
</script>
<template>
    <div class="flex items-center">
        <span class="pr-4">{{ shift.name }}</span>
        <UIcon name="fa7-solid:user-alt" class="size-3 mr-1" />
        <span>
            {{ shift.assigned + shift.supervised + shift.triaged }} Total
            <span v-if="shift.supervised > 0">
                • {{ shift.supervised }} Super
            </span>
            <span v-if="shift.triaged > 0">• {{ shift.triaged }} Triage</span>
        </span>
    </div>
</template>
