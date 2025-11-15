import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: "#161622", padding: 16 }}
    >
      <Text className="text-white text-3xl" style={{ marginBottom: 16 }}>
        Aora
      </Text>

      <Text className="text-white" style={{ marginBottom: 24 }}>
        Welcome to the starter app.
      </Text>

      <Link href="/profile" asChild>
        <Pressable
          className="px-4 py-2 rounded"
          style={{ backgroundColor: "#FF8C00" }}
        >
          <Text className="text-white font-semibold">Go to Profile</Text>
        </Pressable>
      </Link>
    </View>
  );
}
