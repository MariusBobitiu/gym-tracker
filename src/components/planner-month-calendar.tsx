import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui";
import { resolveAccessibilityLabel } from "@/lib/accessibility";
import { useTheme } from "@/lib/theme-context";

type MonthCalendarProps = {
  monthDate: Date;
  rangeStart: Date;
  rangeEnd: Date;
  onDayPress?: (date: Date) => void;
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isInRange: boolean;
  isToday: boolean;
};

function getCalendarDays(monthDate: Date, rangeStart: Date, rangeEnd: Date): CalendarDay[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map((date) => ({
    date,
    isCurrentMonth: isSameMonth(date, monthStart),
    isInRange: isWithinInterval(date, { start: rangeStart, end: rangeEnd }),
    isToday: isSameDay(date, new Date()),
  }));
}

function WeekdayRow({ labels }: { labels: string[] }): React.JSX.Element {
  const { colors, tokens } = useTheme();
  return (
    <View className="mt-3 flex-row">
      {labels.map((label) => (
        <View key={label} style={{ width: `${100 / 7}%` }}>
          <Text
            style={{
              fontSize: tokens.typography.sizes.xs,
              color: colors.mutedForeground,
              textAlign: "center",
              fontWeight: tokens.typography.weights.semibold,
            }}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

type DayCellProps = {
  day: CalendarDay;
  onPress?: (date: Date) => void;
};

function DayCell({ day, onPress }: DayCellProps): React.JSX.Element {
  const { colors, tokens } = useTheme();
  const textColor = day.isCurrentMonth ? `${colors.foreground}95` : `${colors.foreground}30`;
  const rangeBg = day.isToday
    ? `${colors.primary}10`
    : day.isInRange
      ? `${colors.foreground}10`
      : "transparent";
  const dayBorder = day.isToday
    ? colors.primary
    : day.isInRange
      ? `${colors.foreground}30`
      : "transparent";

  return (
    <Pressable
      style={{ width: `${100 / 7}%` }}
      onPress={() => onPress?.(day.date)}
      className="items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel={resolveAccessibilityLabel({
        fallback: `Select ${format(day.date, "EEEE, MMMM d")}`,
      })}>
      <View
        className="items-center justify-center rounded-lg"
        style={{
          height: 36,
          width: 36,
          marginVertical: 2,
          backgroundColor: rangeBg,
          borderWidth: day.isToday ? 1 : 0,
          borderColor: dayBorder,
        }}>
        <Text
          style={{
            fontSize: tokens.typography.sizes.xs,
            color: day.isToday ? colors.primary : day.isInRange ? colors.foreground : textColor,
            fontWeight: day.isInRange
              ? tokens.typography.weights.semibold
              : tokens.typography.weights.medium,
          }}>
          {day.date.getDate()}
        </Text>
      </View>
    </Pressable>
  );
}

function CalendarGrid({
  days,
  onDayPress,
}: {
  days: CalendarDay[];
  onDayPress?: (date: Date) => void;
}): React.JSX.Element {
  return (
    <View className="mt-2 flex-row flex-wrap">
      {days.map((day) => (
        <DayCell key={day.date.toISOString()} day={day} onPress={onDayPress} />
      ))}
    </View>
  );
}

export function PlannerMonthCalendar({
  monthDate,
  rangeStart,
  rangeEnd,
  onDayPress,
}: MonthCalendarProps): React.JSX.Element {
  const weekDayLabels = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []);
  const calendarDays = useMemo(
    () => getCalendarDays(monthDate, rangeStart, rangeEnd),
    [monthDate, rangeEnd, rangeStart]
  );

  return (
    <View>
      <WeekdayRow labels={weekDayLabels} />
      <CalendarGrid days={calendarDays} onDayPress={onDayPress} />
    </View>
  );
}
