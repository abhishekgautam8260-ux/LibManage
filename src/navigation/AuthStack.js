import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LandingScreen from "../screens/LandingScreen";
import SignupScreen from "../screens/SignupScreen";
import LoginScreen from "../screens/LoginScreen";
import CreateLibraryScreen from "../screens/CreateLibraryScreen";

const Stack = createNativeStackNavigator();

// Mirrors newindex.html -> newsignup.html / newlogin.html -> createlibrary.html
export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CreateLibrary" component={CreateLibraryScreen} />
    </Stack.Navigator>
  );
}
