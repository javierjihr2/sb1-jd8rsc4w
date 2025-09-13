import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

interface NavigationItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
}

interface AdaptiveNavigationProps {
  items: NavigationItem[];
  children: React.ReactNode;
  sidebarWidth?: number;
}

export const AdaptiveNavigation: React.FC<AdaptiveNavigationProps> = ({
  items,
  children,
  sidebarWidth = 280,
}) => {
  const { isTablet, isLandscape, width } = useDeviceInfo();

  const showSidebar = isTablet && isLandscape && width >= 1024;

  const renderSidebarItem = (item: NavigationItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.sidebarItem,
        item.active && styles.sidebarItemActive,
      ]}
      onPress={item.onPress}
    >
      <Ionicons
        name={item.icon}
        size={24}
        color={item.active ? '#007AFF' : '#666'}
        style={styles.sidebarIcon}
      />
      <Text
        style={[
          styles.sidebarText,
          item.active && styles.sidebarTextActive,
        ]}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderBottomTabItem = (item: NavigationItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.bottomTabItem,
        item.active && styles.bottomTabItemActive,
      ]}
      onPress={item.onPress}
    >
      <Ionicons
        name={item.icon}
        size={24}
        color={item.active ? '#007AFF' : '#666'}
      />
      <Text
        style={[
          styles.bottomTabText,
          item.active && styles.bottomTabTextActive,
        ]}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  if (showSidebar) {
    return (
      <View style={styles.sidebarContainer}>
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>SquadGO</Text>
          </View>
          <View style={styles.sidebarItems}>
            {items.map(renderSidebarItem)}
          </View>
        </View>
        <View style={[styles.content, { marginLeft: sidebarWidth }]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bottomTabContainer}>
      <View style={styles.content}>
        {children}
      </View>
      <View style={styles.bottomTabs}>
        {items.map(renderBottomTabItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Sidebar Layout
  sidebarContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
    paddingTop: 60, // Para el status bar
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sidebarItems: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  sidebarItemActive: {
    backgroundColor: '#e3f2fd',
  },
  sidebarIcon: {
    marginRight: 16,
  },
  sidebarText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  sidebarTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // Bottom Tab Layout
  bottomTabContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingBottom: 34, // Para el safe area
    paddingTop: 8,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomTabItemActive: {
    // Estilo activo para bottom tabs
  },
  bottomTabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default AdaptiveNavigation;