/**
 * Modal
 * Dependencies:
 * - @gorhom/bottom-sheet.
 *
 * Props:
 * - All `BottomSheetModalProps` props.
 * - `title` (string | undefined): Optional title for the modal header.
 *
 * Usage Example:
 * import { Modal, useModal } from '@gorhom/bottom-sheet';
 *
 * function DisplayModal() {
 *   const { ref, present, dismiss } = useModal();
 *
 *   return (
 *     <View>
 *       <Modal
 *         snapPoints={['60%']} // optional
 *         title="Modal Title"
 *         ref={ref}
 *       >
 *         Modal Content
 *       </Modal>
 *     </View>
 *   );
 * }
 *
 */

import type {
  BottomSheetBackdropProps,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { BottomSheetModal, useBottomSheet } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import * as React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";

import { useTheme } from "@/lib/theme-context";

type ModalProps = BottomSheetModalProps & {
  title?: string;
};

type ModalRef = React.ForwardedRef<BottomSheetModal>;

type ModalHeaderProps = {
  title?: string;
  dismiss: () => void;
};

export const useModal = () => {
  const ref = React.useRef<BottomSheetModal>(null);
  const present = React.useCallback((data?: any) => {
    ref.current?.present(data);
  }, []);
  const dismiss = React.useCallback(() => {
    ref.current?.dismiss();
  }, []);
  return { ref, present, dismiss };
};

export const Modal = React.forwardRef(
  (
    {
      snapPoints: _snapPoints = ["60%"],
      title,
      detached = false,
      containerStyle: containerStyleProp,
      backgroundStyle: backgroundStyleProp,
      ...props
    }: ModalProps,
    ref: ModalRef
  ) => {
    const detachedProps = React.useMemo(
      () => getDetachedProps(detached),
      [detached]
    );
    const modal = useModal();
    const snapPoints = React.useMemo(() => _snapPoints, [_snapPoints]);

    React.useImperativeHandle(
      ref,
      () => (modal.ref.current as BottomSheetModal) || null
    );

    const { colors: themeColors, tokens } = useTheme();

    const containerStyle = React.useMemo(
      () =>
        StyleSheet.flatten([
          { backgroundColor: "transparent" },
          containerStyleProp,
        ]),
      [containerStyleProp]
    );

    const backgroundStyle = React.useMemo(
      () =>
        StyleSheet.flatten([
          { backgroundColor: themeColors.background },
          backgroundStyleProp,
        ]),
      [themeColors.background, backgroundStyleProp]
    );

    const renderHandleComponent = React.useCallback(
      () => (
        <View
          className="mb-2 self-center rounded-lg"
          style={{
            backgroundColor: themeColors.muted,
            borderRadius: tokens.radius.md,
            height: 4,
            width: 48,
            marginTop: tokens.spacing.sm,
            marginBottom: tokens.spacing.sm,
          }}
        />
      ),
      [themeColors.muted, tokens]
    );

    return (
      <BottomSheetModal
        {...props}
        {...detachedProps}
        ref={modal.ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={props.backdropComponent || renderBackdrop}
        enableDynamicSizing={false}
        containerStyle={containerStyle}
        backgroundStyle={backgroundStyle}
        handleComponent={renderHandleComponent}
      >
        <>
          <ModalHeader title={title} dismiss={modal.dismiss} />
          {props.children}
        </>
      </BottomSheetModal>
    );
  }
);

/**
 * Custom Backdrop: dark semi-transparent overlay with optional blur.
 * Opacity is driven by animatedIndex so the backdrop fades in sync with the sheet
 * (avoids 1–2s delay where the backdrop stayed visible after the sheet closed).
 */

const BACKDROP_OPACITY = 0.25;

const DISAPPEARS_ON_INDEX = 0;

const CustomBackdrop = ({ style, animatedIndex }: BottomSheetBackdropProps) => {
  const { close } = useBottomSheet();
  const [pointerEvents, setPointerEvents] = React.useState<
    "auto" | "box-none" | "none"
  >("auto");

  const backdropAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        animatedIndex.value,
        [-1, DISAPPEARS_ON_INDEX],
        [0, 1],
        Extrapolation.CLAMP
      ),
    }),
    [animatedIndex]
  );

  const setTouchability = React.useCallback((disabled: boolean) => {
    setPointerEvents(disabled ? "none" : "auto");
  }, []);

  useAnimatedReaction(
    () => animatedIndex.value <= -1,
    (shouldDisable, previous) => {
      if (previous === shouldDisable) return;
      runOnJS(setTouchability)(shouldDisable);
    },
    [-1]
  );

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style, backdropAnimatedStyle]}
      pointerEvents={pointerEvents}
    >
      <Pressable
        onPress={() => close()}
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 20 : 30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(0, 0, 0, ${BACKDROP_OPACITY})` },
          ]}
          pointerEvents="none"
        />
      </Pressable>
    </Animated.View>
  );
};

export const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <CustomBackdrop {...props} />
);

/**
 *
 * @param detached
 * @returns
 *
 * @description
 * In case the modal is detached, we need to add some extra props to the modal to make it look like a detached modal.
 */

const getDetachedProps = (detached: boolean) => {
  if (detached) {
    return {
      detached: true,
      bottomInset: 46,
      style: { marginHorizontal: 16, overflow: "hidden" },
    } as Partial<BottomSheetModalProps>;
  }
  return {} as Partial<BottomSheetModalProps>;
};

/**
 * ModalHeader
 */

const ModalHeader = React.memo(({ title, dismiss }: ModalHeaderProps) => {
  const { colors: themeColors, tokens } = useTheme();
  const titleStyle = React.useMemo(
    () => ({
      color: themeColors.foreground,
      fontSize: tokens.typography.sizes.md,
      lineHeight: tokens.typography.lineHeights.md,
      fontWeight: tokens.typography.weights.bold,
      textAlign: "center" as const,
    }),
    [themeColors.foreground, tokens]
  );
  return (
    <>
      {title && (
        <View
          className="flex-row"
          style={{
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: tokens.spacing.lg,
          }}
        >
          <View style={{ height: 24, width: 24 }} />
          <View className="flex-1 justify-center">
            <RNText style={titleStyle} numberOfLines={1}>
              {title}
            </RNText>
          </View>
        </View>
      )}
      <CloseButton close={dismiss} />
    </>
  );
});

const CloseButton = ({ close }: { close: () => void }) => {
  const { colors: themeColors, tokens } = useTheme();
  return (
    <Pressable
      onPress={close}
      className="absolute right-3 top-3 size-[24px] items-center justify-center "
      style={{
        top: tokens.spacing.md,
        right: tokens.spacing.md,
        height: 24,
        width: 24,
        borderRadius: tokens.radius.pill,
      }}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      accessibilityLabel="close modal"
      accessibilityRole="button"
      accessibilityHint="closes the modal"
    >
      <Svg width={24} height={24} fill="none" viewBox="0 0 24 24">
        <Path
          d="M18.707 6.707a1 1 0 0 0-1.414-1.414L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293Z"
          fill={themeColors.foreground}
        />
      </Svg>
    </Pressable>
  );
};
