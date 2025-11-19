import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      console.log(token, "tokenr");

      // We use setTimeout to ensure the navigation system is fully mounted
      setTimeout(() => {
        if (token) {
          router.replace("/(tabs)/dashboard");
        } else {
          router.replace("/login");
        }
      }, 100);
    } catch (e) {
      // If storage fails, safe default is login
      router.replace("/login");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#FFC107" />
    </View>
  );
}
