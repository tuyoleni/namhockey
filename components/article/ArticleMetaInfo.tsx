import React from "react";
import { View, Text, Image } from "react-native";
import type { Tables } from "types/database.types";

interface ArticleMetaInfoProps {
  profile: Tables<"profiles"> | null | undefined;
  authorProfileId: string | null | undefined;
  publishedAt: string | null | undefined;
}

const ArticleMetaInfo: React.FC<ArticleMetaInfoProps> = ({ profile, authorProfileId, publishedAt }) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  // Determine the display name.
  const displayName = profile?.display_name || "Unknown Author";

  return (
    <View className="flex-row items-center  mb-4 mt-2 pb-2">
      {profile?.profile_picture ? (
        <Image source={{ uri: profile.profile_picture }} className="w-9 h-9 rounded-full mr-3" />
      ) : (
        <View className="w-9 h-9 rounded-full bg-[#f2f2f7] mr-3 items-center justify-center">
          <Text className="text-[#86868b] font-medium">
            {displayName.charAt(0)?.toUpperCase() || "A"}
          </Text>
        </View>
      )}
      <View>
        <Text className="text-[15px] font-medium text-[#1d1d1f]">
          {displayName}
        </Text>
        <Text className="text-xs text-[#808080]">
          {formatDate(publishedAt)} • {formatTime(publishedAt)}
        </Text>
      </View>
    </View>
  );
};

export default ArticleMetaInfo;
