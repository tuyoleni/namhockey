// components/article/ArticleHeader.tsx
import React from "react";
import { View, Image, TouchableOpacity, Platform, Animated } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

interface ArticleHeaderProps {
  coverImageUrl: string | null | undefined;
  scrollY: Animated.AnimatedValue; // Receive the Animated.Value
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({ coverImageUrl, scrollY }) => {
  const router = useRouter();
  const handleBackPress = () => {
    router.back();
  };

  // Back button opacity for scroll effect (now inside this component)
  const backButtonOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.7],
    extrapolate: "clamp",
  });

  return (
    <View className="relative">
      {coverImageUrl ? (
        <Image
          source={{ uri: coverImageUrl }}
          className="w-full h-96"
          style={{ resizeMode: "cover" }}
        />
      ) : (
        <View className="w-full h-96 bg-[#f5f5f7]" />
      )}

      <View
        className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
        style={{ height: 96 * 2 }}
      />

      <Animated.View
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 50 : 30,
          left: 20,
          opacity: backButtonOpacity,
        }}
      >
        <TouchableOpacity
          onPress={handleBackPress}
          className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default ArticleHeader;