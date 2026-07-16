<script setup lang="ts">
import { clsx } from "clsx";
import type { Shift } from "../../server/core/types";
import type { ShiftFlags } from "../utils/shiftFlags";
import { modes } from "../utils/modes";

const { board, send } = useBoard();
const props = defineProps<{
    shiftId: string;
    flags: ShiftFlags | null;
    zoneSlug: string | null;
}>();

const shift = computed<Shift | undefined>(
    () => board.value?.shifts[props.shiftId],
);

const useNextHighlight = computed(() => {
    return props.flags.isNext & props.flags.isRotating;
});

const getShiftStyles = (flags: ShiftFlags) => ({
    card: clsx(
        "md:rounded md:mb-4 dark:bg-neutral-800 border",
        useNextHighlight.value
            ? "border-2 border-amber-300 bg-yellow-50"
            : "bg-white border-neutral-300",
    ),
    nextBanner: clsx(
        "hidden bg-amber-300 text-xs justify-around font-bold text-white",
        useNextHighlight.value && "md:flex",
    ),
    menuBar: clsx(
        "first:rounded-t hidden md:flex items-center justify-between uppercase text-xs font-medium py-1 px-2",
        useNextHighlight.value
            ? "text-amber-500 bg-amber-100"
            : "text-dimmed md:text-muted md:bg-neutral-100 dark:md:bg-neutral-700",
    ),
    content: clsx(
        "px-2 py-1 md:p-3 flex justify-between",
        flags.isOff && "text-neutral-500 bg-neutral-100 dark:bg-neutral-800",
    ),
    providerName: "font-bold text-lg md:text-2xl",
    buttons: clsx("flex gap-2", flags.isOff && "hidden"),
    bonusBadge:
        "self-center bg-amber-100 text-amber-500 border border-amber-500",
    superBadge: "bg-sky-300 self-center border border-sky-400",
    pausedBadge: "bg-orange-400 self-center",
    skippedBadge: "bg-orange-400 self-center",
});

const styles = computed(() =>
    props.flags ? getShiftStyles(props.flags) : null,
);
</script>

<template>
    <div v-if="shift" :class="styles?.card">
        <!-- NEXT BANNER -->
        <div v-if="flags?.isNext" :class="styles?.nextBanner">NEXT</div>

        <!-- MENU BAR -->
        <div :class="styles?.menuBar">
            <div class="hidden md:flex">
                <ShiftMeta :shift="shift" />
            </div>
            <div class="flex gap-3">
                <AssignPop
                    variant="shift"
                    :shiftId="shift.id"
                    :zoneSlug="zoneSlug"
                >
                    <UIcon
                        class="cursor-pointer size-5"
                        name="fa7-solid:user-plus"
                        title="Assign off rotation"
                    />
                </AssignPop>
                <ShiftMenu :shift="shift" :zoneSlug="zoneSlug" />
            </div>
        </div>

        <!-- MAIN CONTENT -->
        <div :class="styles?.content">
            <!-- LEFT SIDE W/NAME -->
            <div>
                <!-- META INFO ONLY ON SMALL -->
                <div class="md:hidden flex text-xs uppercase text-dimmed">
                    <ShiftMenu
                        :shift="shift"
                        :zoneSlug="zoneSlug"
                        class="mr-2"
                    />

                    <ShiftMeta :shift="shift" />
                </div>
                <!-- NAME -->
                <div :class="styles?.providerName">
                    {{ shift.first }} {{ shift.last }}
                </div>
            </div>

            <!-- RIGHT SIDE WITH BUTTONS & BADGES -->
            <div :class="styles?.buttons">
                <!-- BADGES -->
                <UBadge
                    v-if="flags?.isSuper"
                    :class="styles?.superBadge"
                    size="sm"
                    title="Supervisor"
                >
                    <span class="flex md:hidden">S</span>
                    <span class="hidden md:flex">SUPER</span>
                </UBadge>
                <UBadge
                    v-if="flags?.isPaused"
                    :class="styles?.pausedBadge"
                    size="sm"
                    label="PAUSED"
                />
                <UBadge
                    v-if="flags.isSkipped"
                    :class="styles?.skippedBadge"
                    size="sm"
                    label="SKIP"
                />
                <UBadge
                    v-if="shift.bonus > shift.assigned"
                    :class="styles?.bonusBadge"
                    icon="lucide:rocket"
                    title="Bonus"
                    :label="`${shift.bonus - shift.assigned}`"
                />

                <!-- BUTTONS -->
                <div class="flex gap-1">
                    <ShiftTriageButton
                        v-if="zoneSlug === 'ft'"
                        :shiftId="shiftId"
                    />
                    <AssignPop
                        v-if="flags?.isNext"
                        class="self-center"
                        shiftId="shiftId"
                        :zoneSlug="zoneSlug"
                    >
                        <UButton
                            v-if="variant !== 'shift'"
                            color="neutral"
                            title="Assign Patient"
                            leading-icon="fa7-solid:user-plus"
                            trailing-icon="fa7-solid:caret-down"
                        >
                            <span class="hidden md:flex">Assign</span>
                        </UButton>
                    </AssignPop>
                </div>
            </div>
        </div>
    </div>
</template>
