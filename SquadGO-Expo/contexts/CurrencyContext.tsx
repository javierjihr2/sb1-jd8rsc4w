import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  bonus?: number;
  popular?: boolean;
  icon: string;
}

export interface PurchaseableItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'theme' | 'avatar' | 'boost' | 'feature' | 'cosmetic';
  icon: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  duration?: number; // For temporary items (in days)
  owned?: boolean;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'earn' | 'spend' | 'bonus';
  amount: number;
  description: string;
  timestamp: Date;
  itemId?: string;
}

interface CurrencyContextType {
  // Currency state
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  
  // Packages and items
  coinPackages: CoinPackage[];
  storeItems: PurchaseableItem[];
  ownedItems: string[];
  
  // Actions
  purchaseCoins: (packageId: string) => Promise<boolean>;
  spendCoins: (amount: number, description: string, itemId?: string) => Promise<boolean>;
  earnCoins: (amount: number, description: string) => Promise<void>;
  purchaseItem: (itemId: string) => Promise<boolean>;
  
  // Utilities
  canAfford: (amount: number) => boolean;
  getItemById: (itemId: string) => PurchaseableItem | undefined;
  refreshBalance: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Available coin packages
const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'small_pack',
    name: 'Paquete Pequeño',
    coins: 100,
    price: 0.99,
    currency: 'USD',
    icon: '🪙'
  },
  {
    id: 'medium_pack',
    name: 'Paquete Mediano',
    coins: 500,
    price: 4.99,
    currency: 'USD',
    bonus: 50,
    popular: true,
    icon: '💰'
  },
  {
    id: 'large_pack',
    name: 'Paquete Grande',
    coins: 1200,
    price: 9.99,
    currency: 'USD',
    bonus: 200,
    icon: '💎'
  },
  {
    id: 'mega_pack',
    name: 'Paquete Mega',
    coins: 2500,
    price: 19.99,
    currency: 'USD',
    bonus: 500,
    icon: '👑'
  }
];

// Store items
const STORE_ITEMS: PurchaseableItem[] = [
  // Themes
  {
    id: 'dark_theme',
    name: 'Tema Oscuro Premium',
    description: 'Tema oscuro elegante con acentos dorados',
    price: 150,
    category: 'theme',
    icon: '🌙',
    rarity: 'rare'
  },
  {
    id: 'neon_theme',
    name: 'Tema Neón',
    description: 'Tema futurista con efectos de neón',
    price: 250,
    category: 'theme',
    icon: '⚡',
    rarity: 'epic'
  },
  
  // Avatars
  {
    id: 'elite_avatar',
    name: 'Avatar Elite',
    description: 'Marco de avatar exclusivo para jugadores elite',
    price: 300,
    category: 'avatar',
    icon: '👤',
    rarity: 'epic'
  },
  {
    id: 'legendary_avatar',
    name: 'Avatar Legendario',
    description: 'Marco de avatar animado ultra exclusivo',
    price: 500,
    category: 'avatar',
    icon: '🏆',
    rarity: 'legendary'
  },
  
  // Boosts
  {
    id: 'xp_boost_7d',
    name: 'Boost XP (7 días)',
    description: 'Duplica la experiencia ganada por 7 días',
    price: 100,
    category: 'boost',
    icon: '⚡',
    duration: 7,
    rarity: 'common'
  },
  {
    id: 'coin_boost_3d',
    name: 'Boost Monedas (3 días)',
    description: '+50% monedas por actividades por 3 días',
    price: 75,
    category: 'boost',
    icon: '💰',
    duration: 3,
    rarity: 'common'
  },
  
  // Features
  {
    id: 'extra_strategies',
    name: 'Estrategias Extra',
    description: '+10 slots para guardar estrategias',
    price: 200,
    category: 'feature',
    icon: '📋',
    rarity: 'rare'
  },
  {
    id: 'priority_support',
    name: 'Soporte Prioritario (30 días)',
    description: 'Acceso a soporte prioritario por 30 días',
    price: 150,
    category: 'feature',
    icon: '🎧',
    duration: 30,
    rarity: 'rare'
  },
  
  // Cosmetics
  {
    id: 'victory_emote',
    name: 'Emote de Victoria',
    description: 'Emote especial para celebrar victorias',
    price: 80,
    category: 'cosmetic',
    icon: '🎉',
    rarity: 'common'
  },
  {
    id: 'rare_badge',
    name: 'Insignia Rara',
    description: 'Insignia exclusiva para mostrar en tu perfil',
    price: 120,
    category: 'cosmetic',
    icon: '🏅',
    rarity: 'rare'
  }
];

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrencyData();
  }, []);

  const loadCurrencyData = async () => {
    try {
      const [savedBalance, savedTransactions, savedOwnedItems] = await Promise.all([
        AsyncStorage.getItem('user_balance'),
        AsyncStorage.getItem('user_transactions'),
        AsyncStorage.getItem('owned_items')
      ]);

      if (savedBalance) {
        setBalance(parseInt(savedBalance, 10));
      } else {
        // Give new users some starting coins
        setBalance(50);
        await AsyncStorage.setItem('user_balance', '50');
      }

      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);
        parsedTransactions.forEach((t: Transaction) => {
          t.timestamp = new Date(t.timestamp);
        });
        setTransactions(parsedTransactions);
      }

      if (savedOwnedItems) {
        setOwnedItems(JSON.parse(savedOwnedItems));
      }
    } catch (error) {
      console.error('Error loading currency data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBalance = async (newBalance: number) => {
    try {
      await AsyncStorage.setItem('user_balance', newBalance.toString());
    } catch (error) {
      console.error('Error saving balance:', error);
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem('user_transactions', JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const saveOwnedItems = async (items: string[]) => {
    try {
      await AsyncStorage.setItem('owned_items', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving owned items:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    const updatedTransactions = [newTransaction, ...transactions].slice(0, 100); // Keep last 100 transactions
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);
  };

  const purchaseCoins = async (packageId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const coinPackage = COIN_PACKAGES.find(p => p.id === packageId);
      if (!coinPackage) {
        throw new Error('Package not found');
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalCoins = coinPackage.coins + (coinPackage.bonus || 0);
      const newBalance = balance + totalCoins;
      
      setBalance(newBalance);
      await saveBalance(newBalance);
      
      await addTransaction({
        type: 'purchase',
        amount: totalCoins,
        description: `Compra: ${coinPackage.name}`
      });
      
      Alert.alert(
        '¡Compra Exitosa!',
        `Has recibido ${totalCoins} SquadCoins${coinPackage.bonus ? ` (incluyendo ${coinPackage.bonus} de bonus)` : ''}!`
      );
      
      return true;
    } catch (error) {
      console.error('Error purchasing coins:', error);
      Alert.alert(
        'Error de Compra',
        'No se pudo procesar tu compra. Inténtalo de nuevo.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const spendCoins = async (amount: number, description: string, itemId?: string): Promise<boolean> => {
    if (balance < amount) {
      Alert.alert(
        'Saldo Insuficiente',
        'No tienes suficientes SquadCoins para esta compra.'
      );
      return false;
    }

    try {
      const newBalance = balance - amount;
      setBalance(newBalance);
      await saveBalance(newBalance);
      
      await addTransaction({
        type: 'spend',
        amount: -amount,
        description,
        itemId
      });
      
      return true;
    } catch (error) {
      console.error('Error spending coins:', error);
      return false;
    }
  };

  const earnCoins = async (amount: number, description: string): Promise<void> => {
    try {
      const newBalance = balance + amount;
      setBalance(newBalance);
      await saveBalance(newBalance);
      
      await addTransaction({
        type: 'earn',
        amount,
        description
      });
    } catch (error) {
      console.error('Error earning coins:', error);
    }
  };

  const purchaseItem = async (itemId: string): Promise<boolean> => {
    const item = STORE_ITEMS.find(i => i.id === itemId);
    if (!item) {
      Alert.alert('Error', 'Artículo no encontrado.');
      return false;
    }

    if (ownedItems.includes(itemId)) {
      Alert.alert('Ya Poseído', 'Ya posees este artículo.');
      return false;
    }

    const success = await spendCoins(item.price, `Compra: ${item.name}`, itemId);
    if (success) {
      const updatedOwnedItems = [...ownedItems, itemId];
      setOwnedItems(updatedOwnedItems);
      await saveOwnedItems(updatedOwnedItems);
      
      Alert.alert(
        '¡Compra Exitosa!',
        `Has adquirido: ${item.name}`
      );
    }
    
    return success;
  };

  const canAfford = (amount: number): boolean => {
    return balance >= amount;
  };

  const getItemById = (itemId: string): PurchaseableItem | undefined => {
    return STORE_ITEMS.find(item => item.id === itemId);
  };

  const refreshBalance = async (): Promise<void> => {
    await loadCurrencyData();
  };

  // Mark owned items in store items
  const storeItemsWithOwnership = STORE_ITEMS.map(item => ({
    ...item,
    owned: ownedItems.includes(item.id)
  }));

  const value: CurrencyContextType = {
    balance,
    transactions,
    isLoading,
    coinPackages: COIN_PACKAGES,
    storeItems: storeItemsWithOwnership,
    ownedItems,
    purchaseCoins,
    spendCoins,
    earnCoins,
    purchaseItem,
    canAfford,
    getItemById,
    refreshBalance
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;