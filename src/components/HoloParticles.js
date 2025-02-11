import React from "react";
import { View, StyleSheet } from "react-native";
import { Skia, Canvas, Circle, Paint } from "@shopify/react-native-skia";

const HoloParticles = () => {
  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {[...Array(10)].map((_, i) => (
          <Circle key={i} cx={Math.random() * 300} cy={Math.random() * 500} r={8} color="cyan">
            <Paint blur={8} />
          </Circle>
        ))}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
});

export default HoloParticles;
