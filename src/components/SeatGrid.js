import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../theme/colors";

export default function SeatGrid({
  seats = [],
  onVacantPress,
  onOccupiedPress,
  onHeldPress,
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const { width } = useWindowDimensions();

  /*
   * IMPORTANT
   *
   * Desktop styling is ONLY enabled on web.
   *
   * Android/iOS remain exactly the same.
   */
  const isDesktop = Platform.OS === "web" && width >= 1024;

  const styles = createStyles(colors, isDesktop);

  // ============================================================
  // SORT
  // ============================================================

  const sortedSeats = [...seats].sort((a, b) => a.seatNumber - b.seatNumber);

  // ============================================================
  // CREATE ROWS
  // ============================================================

  const rows = [];

  for (let i = 0; i < sortedSeats.length; i += 5) {
    rows.push(sortedSeats.slice(i, i + 5));
  }

  // ============================================================
  // RENDER SEAT
  // ============================================================

  const renderSeat = (seat, index, rowIndex) => {
    const seatNumber = seat.seatNumber;

    const occupied = !!seat.occupied;

    const held = !!seat.held;

    const status = occupied ? "occupied" : held ? "held" : "vacant";

    const handlePress = () => {
      if (status === "occupied") {
        if (onOccupiedPress) {
          onOccupiedPress(seatNumber);
        }

        return;
      }

      if (status === "held") {
        if (onHeldPress) {
          onHeldPress(seat);
        }

        return;
      }

      if (onVacantPress) {
        onVacantPress(seatNumber);
      }
    };

    let backgroundColor;
    let borderColor;
    let textColor;

    if (status === "occupied") {
      backgroundColor = colors.seatOccupied;
      borderColor = colors.seatBorder;
      textColor = colors.textSecondary;
    } else if (status === "held") {
      backgroundColor = colors.warningBg;
      borderColor = colors.warning;
      textColor = colors.warning;
    } else {
      backgroundColor = colors.seatVacant;
      borderColor = colors.seatBorder;
      textColor = colors.textPrimary;
    }

    return (
      <TouchableOpacity
        key={`${seatNumber}-${index}`}
        activeOpacity={0.75}
        onPress={handlePress}
        style={[
          styles.seat,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <Text
          style={[
            styles.seatNumber,
            {
              color: textColor,
            },
          ]}
        >
          {seatNumber}
        </Text>

        {status === "occupied" && (
          <Text
            style={[
              styles.statusText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            BOOKED
          </Text>
        )}

        {status === "held" && (
          <>
            <Text
              style={[
                styles.statusText,
                {
                  color: colors.warning,
                },
              ]}
            >
              HELD
            </Text>

            {seat.holdName ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.holdName,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {seat.holdName}
              </Text>
            ) : null}
          </>
        )}

        {status === "vacant" && (
          <Text
            style={[
              styles.statusText,
              {
                color: colors.primaryGreen,
              },
            ]}
          >
            FREE
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => {
        const displayRow = rowIndex % 2 === 1 ? [...row].reverse() : row;

        return (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {displayRow.map((seat, index) => renderSeat(seat, index, rowIndex))}
          </View>
        );
      })}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const createStyles = (colors, isDesktop) =>
  StyleSheet.create({
    container: {
      width: "100%",

      paddingVertical: isDesktop ? 4 : 8,

      alignItems: "center",
    },

    row: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",

      marginBottom: isDesktop ? 13 : 10,

      gap: isDesktop ? 12 : 8,
    },

    seat: {
      width: isDesktop ? 78 : 58,

      minHeight: isDesktop ? 78 : 62,

      borderWidth: isDesktop ? 1.5 : 1.5,

      borderRadius: isDesktop ? 14 : 12,

      justifyContent: "center",
      alignItems: "center",

      paddingVertical: isDesktop ? 9 : 7,

      paddingHorizontal: 4,
    },

    seatNumber: {
      fontSize: isDesktop ? 21 : 17,

      fontWeight: "800",

      lineHeight: isDesktop ? 24 : 20,
    },

    statusText: {
      fontSize: isDesktop ? 8 : 7,

      fontWeight: "800",

      marginTop: 3,

      letterSpacing: 0.4,
    },

    holdName: {
      maxWidth: isDesktop ? 65 : 48,

      fontSize: isDesktop ? 8 : 7,

      fontWeight: "600",

      marginTop: 2,
    },
  });
