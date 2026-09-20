import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/DashboardScreen";
import HalfDayStudentsScreen from "../screens/HalfDayStudentsScreen";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />

      <Stack.Screen name="HalfDayStudents" component={HalfDayStudentsScreen} />
    </Stack.Navigator>
  );
}
