import { cssInterop } from "nativewind";
import { ActivityIndicator, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import Svg from "react-native-svg";

// Apply cssInterop BEFORE exporting components to ensure className support
cssInterop(Pressable, {
  className: {
    target: "style",
  },
});

cssInterop(ActivityIndicator, {
  className: {
    target: "style",
  },
});

cssInterop(Svg, {
  className: {
    target: "style",
  },
});

export * from "./button";
export * from "./card";
export * from "./checkbox";
export { default as colors } from "./colors";
export * from "./image";
export * from "./input";
export * from "./list";
export * from "./modal";
export * from "./progress-bar";
export * from "./select";
export * from "./text";
export * from "./typography";
export * from "./utils";

// export base components from react-native
export { ActivityIndicator, Pressable, ScrollView, TouchableOpacity, View };
export { SafeAreaView } from "react-native-safe-area-context";
