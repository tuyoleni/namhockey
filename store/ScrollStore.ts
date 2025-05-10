import { create } from 'zustand';
import { Animated } from 'react-native';

type ScrollStore = {
  scrollY: Animated.Value;
};

export const useScrollStore = create<ScrollStore>(() => ({
  scrollY: new Animated.Value(0),
}));
