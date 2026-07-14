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
            <TimelinePop :event="event" />
            <div>
                <div class="text-lg md:text-lg font-bold">
                    {{ getShiftName(event.assign) }}
                </div>
                <div class="text-xs font-normal font-mono text-dimmed">
                    <div v-if="event.super">
                        <UBadge
                            color="neutral"
                            variant="soft"
                            label="S"
                            size="sm"
                            class="mr-1"
                        />
                        <span>{{ getShiftName(event.super) }}</span>
                    </div>
                    <div v-if="event.note">
                        <UIcon name="fa7-solid:asterisk" class="mr-1" />
                        <span>{{ event.note }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="text-lg font-bold group cursor-pointer">
            <div class="text-lg md:text-lg font-bold pr-2">
                {{ event.room }}
            </div>
        </div>
    </div>
</template>
