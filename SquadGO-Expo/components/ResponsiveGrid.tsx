import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

interface ResponsiveGridProps {
  children: React.ReactNode[];
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  spacing?: number;
  minItemWidth?: number;
  maxColumns?: {
    phone: number;
    tablet: number;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  style,
  itemStyle,
  spacing = 16,
  minItemWidth = 280,
  maxColumns = { phone: 1, tablet: 3 },
}) => {
  const { width, isTablet } = useDeviceInfo();

  const getColumnsCount = (): number => {
    const maxCols = isTablet ? maxColumns.tablet : maxColumns.phone;
    const availableWidth = width - (spacing * 2); // Padding lateral
    const possibleColumns = Math.floor(availableWidth / (minItemWidth + spacing));
    return Math.min(Math.max(1, possibleColumns), maxCols);
  };

  const columnsCount = getColumnsCount();
  const itemWidth = (width - (spacing * (columnsCount + 1))) / columnsCount;

  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < children.length; i += columnsCount) {
      const rowItems = children.slice(i, i + columnsCount);
      rows.push(
        <View key={i} style={styles.row}>
          {rowItems.map((child, index) => (
            <View
              key={index}
              style={[
                styles.item,
                itemStyle,
                {
                  width: itemWidth,
                  marginRight: index < rowItems.length - 1 ? spacing : 0,
                },
              ]}
            >
              {child}
            </View>
          ))}
          {/* Rellenar espacios vacíos en la última fila */}
          {rowItems.length < columnsCount &&
            Array.from({ length: columnsCount - rowItems.length }).map((_, index) => (
              <View
                key={`empty-${index}`}
                style={{
                  width: itemWidth,
                  marginRight: index < columnsCount - rowItems.length - 1 ? spacing : 0,
                }}
              />
            ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={[styles.container, style, { padding: spacing }]}>
      {renderRows()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  item: {
    flex: 0,
  },
});

export default ResponsiveGrid;