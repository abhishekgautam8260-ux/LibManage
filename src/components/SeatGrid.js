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

  const isDesktop = Platform.OS === "web" && width >= 1024;

  const columns = 5;

  const mobileGap = 6;

  const styles = createStyles(colors, isDesktop, mobileGap);

  // ------------------------------------------------------------
  // SORT SEATS
  // ------------------------------------------------------------

  const sortedSeats = [...seats].sort((a, b) => a.seatNumber - b.seatNumber);

  // ------------------------------------------------------------
  // CREATE ROWS
  // ------------------------------------------------------------

  const rows = [];

  for (let i = 0; i < sortedSeats.length; i += columns) {
    rows.push(sortedSeats.slice(i, i + columns));
  }

  // ------------------------------------------------------------
  // RENDER SEAT
  // ------------------------------------------------------------

  const renderSeat = (seat, index) => {
    const seatNumber = seat.seatNumber;

    const occupied = !!seat.occupied;
    const held = !!seat.held;

    const status = occupied ? "occupied" : held ? "held" : "vacant";

    const handlePress = () => {
      if (status === "occupied") {
        onOccupiedPress?.(seatNumber);
        return;
      }

      if (status === "held") {
        onHeldPress?.(seat);
        return;
      }

      onVacantPress?.(seatNumber);
    };

    // ----------------------------------------------------------
    // COLORS
    // ----------------------------------------------------------

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
        {/* SEAT NUMBER */}
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

        {/* OCCUPIED */}
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

        {/* HELD */}
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
                ellipsizeMode="tail"
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

        {/* VACANT */}
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

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => {
        // Zig-zag arrangement
        const displayRow = rowIndex % 2 === 1 ? [...row].reverse() : row;

        return (
          <View
            key={`row-${rowIndex}`}
            style={[styles.row, isDesktop && styles.desktopRow]}
          >
            {displayRow.map((seat, index) => renderSeat(seat, index))}
          </View>
        );
      })}
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================

function createStyles(colors, isDesktop, mobileGap) {
  return StyleSheet.create({
    // ------------------------------------------------------------
    // CONTAINER
    // ------------------------------------------------------------

    container: {
      width: "100%",
      alignSelf: "stretch",
      alignItems: isDesktop ? "stretch" : "center",

      paddingVertical: isDesktop ? 4 : 6,
      paddingHorizontal: isDesktop ? 0 : 4,
    },

    // ------------------------------------------------------------
    // ROW
    // ------------------------------------------------------------

    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: isDesktop ? 13 : 8,
      gap: isDesktop ? 12 : mobileGap,
    },

    desktopRow: {
      width: "100%",
      alignSelf: "stretch",
      marginBottom: 13,
    },

    // ------------------------------------------------------------
    // SEAT
    // ------------------------------------------------------------

    seat: {
      flex: 1,
      minWidth: 0,

      minHeight: isDesktop ? 78 : 50,

      // Desktop seats expand to fill the row.
      // Mobile sizing stays unchanged.
      maxWidth: isDesktop ? undefined : undefined,

      borderWidth: isDesktop ? 1.5 : 1,
      borderRadius: isDesktop ? 14 : 9,

      justifyContent: "center",
      alignItems: "center",

      paddingVertical: isDesktop ? 9 : 5,
      paddingHorizontal: 2,
    },

    // ------------------------------------------------------------
    // SEAT NUMBER
    // ------------------------------------------------------------

    seatNumber: {
      fontSize: isDesktop ? 21 : 14,

      lineHeight: isDesktop ? 24 : 17,

      fontWeight: "800",
    },

    // ------------------------------------------------------------
    // STATUS
    // ------------------------------------------------------------

    statusText: {
      fontSize: isDesktop ? 8 : 7,

      lineHeight: isDesktop ? 10 : 8,

      fontWeight: "800",

      marginTop: 2,

      letterSpacing: 0.3,
    },

    // ------------------------------------------------------------
    // HOLD NAME
    // ------------------------------------------------------------

    holdName: {
      maxWidth: isDesktop ? 65 : "90%",

      fontSize: isDesktop ? 8 : 7,

      lineHeight: isDesktop ? 10 : 8,

      fontWeight: "600",

      marginTop: 2,

      textAlign: "center",
    },
  });
}
