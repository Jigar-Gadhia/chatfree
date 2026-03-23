// src/screens/HomeScreen.tsx

import ModelCard from "@/src/components/ModelCard";
import ScreenContainer from "@/src/components/ScreenContainer";
import { MODELS } from "@/src/data/models";
import { useModelStore } from "@/src/store/modelStore";
import React, { useEffect } from "react";
import { FlatList } from "react-native";

export default function HomeScreen() {
  const { init } = useModelStore();

  useEffect(() => {
    init();
  }, []);

  return (
    <ScreenContainer title="Choose Model" showBack>
      <FlatList
        data={MODELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ModelCard model={item} />}
      />
    </ScreenContainer>
  );
}
