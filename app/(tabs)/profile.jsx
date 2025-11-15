import { View, Text } from "react-native";

export default function Profile() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: "#161622" }}
    >
      <Text className="text-white text-2xl">Profile</Text>
      <Text className="text-white" style={{ marginTop: 8 }}>
         Profile screen.
      </Text>
    </View>
  );
}
