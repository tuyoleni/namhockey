import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Edit3, UserPlus, ListChecks, Trash2, ChevronRight } from 'lucide-react-native';

interface AdminControlsSectionProps {
  onEditTeam: () => void;
  onAddMember: () => void;
  onManagePositions: () => void;
  onDeleteTeam: () => void;
}

const AdminControlsSection: React.FC<AdminControlsSectionProps> = ({
  onEditTeam,
  onAddMember,
  onManagePositions,
  onDeleteTeam,
}) => {
  const controlItems = [
    {
      label: 'Edit Team Details',
      icon: Edit3,
      action: onEditTeam,
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700',
    },
    {
      label: 'Add New Member',
      icon: UserPlus,
      action: onAddMember,
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700',
    },
    {
      label: 'Manage Player Positions',
      icon: ListChecks,
      action: onManagePositions,
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700',
    },
    {
      label: 'Delete This Team',
      icon: Trash2,
      action: onDeleteTeam,
      iconColor: 'text-red-500',
      textColor: 'text-red-500',
      isLast: true,
    },
  ];

  return (
    <View className="mt-2">
      <Text className="text-xs font-semibold text-gray-400 uppercase px-4 pb-2 pt-4">
        Admin Controls
      </Text>
      <View className="bg-white border-y border-gray-200">
        {controlItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.action}
            className={`flex-row justify-between items-center p-4 active:bg-gray-50 ${
              !item.isLast ? 'border-b border-gray-100' : ''
            } ${item.textColor === 'text-red-500' ? 'active:bg-red-50' : 'active:bg-gray-50'}`}
          >
            <View className="flex-row items-center space-x-3">
              <item.icon size={20} className={item.iconColor} />
              <Text className={`text-base ${item.textColor}`}>{item.label}</Text>
            </View>
            <ChevronRight size={20} className={item.iconColor === 'text-red-500' ? 'text-red-400' : 'text-gray-400'} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
export default React.memo(AdminControlsSection);