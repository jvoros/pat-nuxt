<script setup lang="ts">
import type { Shift, BoardEvent } from "../../server/core/types";
import { convertTime } from "../utils/dates";
const { board, send, getShiftName } = useBoard();

const props = defineProps<{
    event: BoardEvent;
}>();

const styles = {
    assign: "w-full flex flex-row justify-between items-center border border-muted px-3 py-2 rounded bg-white dark:bg-muted text-muted",
    left: "flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0",
};
</script>
<template>
    <div :class="styles.assign">
        <div :class="styles.left">
            <div class="font-mono text-dimmed text-xs">
                {{ convertTime(event.time) }}
            </div>
            <div class="text-lg md:text-lg font-bold group cursor-pointer">
                {{ getShiftName(event.assign) }}
                <UIcon
                    name="fa7-solid:caret-down"
                    class="invisible group-hover:visible"
                />
                <div
                    v-if="event.super"
                    class="text-xs font-normal font-mono text-dimmed"
                >
                    Super: {{ getShiftName(event.super) }}
                </div>
            </div>
        </div>
        <div class="text-lg font-bold group cursor-pointer">
            {{ event.room }}
            <UIcon
                name="fa7-solid:caret-down"
                class="invisible group-hover:visible"
            />
        </div>
    </div>
</template>
