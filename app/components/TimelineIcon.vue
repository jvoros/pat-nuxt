<script setup lang="ts">
import { clsx } from "clsx";
import { timelineModes } from "../utils/modes";
const props = defineProps<{
    mode: string;
}>();

const styles = computed(() =>
    clsx(
        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center -ml-4 border",
        props.mode === "info" && "text-dimmed border-0",
        props.mode === "ft" && "bg-green-200 border-green-500 text-green-500",
        props.mode === "walkin" &&
            "bg-amber-50 border-amber-400 text-amber-400",
        props.mode === "ambo" && "bg-red-200 border-red-500 text-red-500",
        props.mode === "police" && "bg-blue-100 border-blue-400 text-blue-500",
        props.mode === "heli" && "bg-red-500 border-white text-white",
    ),
);
</script>

<template>
    <div :class="styles">
        <UIcon :name="timelineModes[mode].icon" class="size-4" />
    </div>
</template>
