import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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

  const styles = createStyles(colors);

  // ============================================================
  // SORT SEATS
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

    /*
     * IMPORTANT:
     *
     * A seat cannot visually be both booked and held.
     *
     * Occupied always takes priority.
     */
    const status = occupied ? "occupied" : held ? "held" : "vacant";

    // ==========================================================
    // PRESS HANDLER
    // ==========================================================

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

    // ==========================================================
    // COLORS
    // ==========================================================

    let backgroundColor;
    let borderColor;
    let textColor;

    if (status === "occupied") {
      backgroundColor = colors.seatOccupied;

      borderColor = colors.seatBorder;

      textColor = colors.textSecondary;
    } else if (status === "held") {
      /*
       * Orange = temporary seat hold
       */
      backgroundColor = colors.warningBg;

      borderColor = colors.warning;

      textColor = colors.warning;
    } else {
      backgroundColor = colors.seatVacant;

      borderColor = colors.seatBorder;

      textColor = colors.textPrimary;
    }

    // ==========================================================
    // SEAT
    // ==========================================================

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

        {/* STATUS */}

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
        /*
         * Preserve your existing zig-zag layout.
         *
         * Odd rows are reversed.
         */
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

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingVertical: 8,
    },

    row: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
      gap: 8,
    },

    seat: {
      width: 58,
      minHeight: 62,

      borderWidth: 1.5,
      borderRadius: 12,

      justifyContent: "center",
      alignItems: "center",

      paddingVertical: 7,
      paddingHorizontal: 4,
    },

    seatNumber: {
      fontSize: 17,
      fontWeight: "800",
      lineHeight: 20,
    },

    statusText: {
      fontSize: 7,
      fontWeight: "800",
      marginTop: 2,
      letterSpacing: 0.3,
    },

    holdName: {
      maxWidth: 48,
      fontSize: 7,
      fontWeight: "600",
      marginTop: 1,
    },
  });
