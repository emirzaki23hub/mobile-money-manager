import { api } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Calendar, LogOut, Plus, Wallet } from 'lucide-react-native'; // 👈 Calendar imported here
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Type Definitions for clarity ---
type TransactionItem = {
    id: number;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description?: string;
    date: number; 
    walletId: number;
    walletName: string;
    categoryName: string; 
};

type WalletItem = {
    id: number;
    name: string;
    // ... other wallet fields
};


export default function Dashboard() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null); // null = All
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [balRes, listRes, walletRes] = await Promise.all([
        api('/transactions/total'),
        api('/transactions'),
        api('/wallets')
      ]);
      
      if (balRes) setTotalBalance(balRes.balance);
      if (listRes) setTransactions(listRes);
      if (walletRes) setWallets(walletRes);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("token");
    router.replace('/login');
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateHeader = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
  };
  
  const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
      });
  };

  // 1. Filter transactions based on selected wallet
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (selectedWalletId) {
        list = transactions.filter(t => t.walletId === selectedWalletId);
    }
    // Ensure the list is sorted by date descending (newest first)
    return list.sort((a, b) => b.date - a.date); 
  }, [selectedWalletId, transactions]);

  // 2. Group transactions by date
  const transactionsGroupedByDate = useMemo(() => {
    const grouped = filteredTransactions.reduce((acc, transaction) => {
      const dateKey = formatDateHeader(transaction.date); 
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as Record<string, TransactionItem[]>);

    return Object.keys(grouped).map(date => ({
        date,
        data: grouped[date]
    }));
  }, [filteredTransactions]);


  // Calculate balance for the selected view
  const currentBalance = useMemo(() => {
    if (!selectedWalletId) return totalBalance;
    
    return filteredTransactions.reduce((acc, curr) => {
      return curr.type === 'income' ? acc + curr.amount : acc - curr.amount
    }, 0);
  }, [selectedWalletId, filteredTransactions, totalBalance]);

  // Helper component to render a single transaction item
  const renderTransactionItem = (item: TransactionItem) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.transactionItem}
      onPress={() => {
        router.push({
          pathname: '/transaction', 
          params: { transactionId: item.id } 
        });
      }}
    >
      <View style={styles.iconPlaceholder}>
        <Text style={{ fontSize: 20 }}>{item.type === 'income' ? '💰' : item.type === 'expense' ? '💸' : '🔁'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.transTitle}>{item.categoryName}</Text> 
        <Text style={styles.transDesc}>
          {formatTime(item.date)} • {item.description || 'No description'} • {wallets.find(w => w.id === item.walletId)?.name}
        </Text>
      </View>
      <Text style={[
        styles.transAmount, 
        { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
      ]}>
        {item.type === 'income' ? '+' : '-'}{formatIDR(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  // 3. Render the section (date header + transactions for that date)
  const renderTransactionSection = ({ item }: { item: { date: string, data: TransactionItem[] } }) => (
    <View style={styles.dateGroup}>
        <Text style={styles.dateHeader}>{item.date}</Text>
        {item.data.map(renderTransactionItem)}
    </View>
  );


  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>My Money</Text>
          
          <View style={{ flexDirection: 'row', gap: 15 }}>
            
            {/* ⭐️ CALENDAR NAVIGATION CTA ⭐️ */}
            <TouchableOpacity onPress={() => router.push('/calendar')}>
              <Calendar size={24} color="#000" /> 
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/add-wallet')}>
              <Wallet size={24} color="#000" /> 
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleLogout}>
              <LogOut size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.balanceLabel}>
          {selectedWalletId ? wallets.find(w => w.id === selectedWalletId)?.name : "Total Balance"}
        </Text>
        <Text style={styles.balanceValue}>{formatIDR(currentBalance)}</Text>

        {/* Wallet Selector (Horizontal Scroll) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletSelector}>
          <TouchableOpacity 
            style={[styles.walletChip, !selectedWalletId && styles.activeWalletChip]} 
            onPress={() => setSelectedWalletId(null)}
          >
            <Text style={[styles.walletChipText, !selectedWalletId && styles.activeWalletChipText]}>All</Text>
          </TouchableOpacity>
          
          {wallets.map((w) => (
            <TouchableOpacity 
              key={w.id}
              style={[styles.walletChip, selectedWalletId === w.id && styles.activeWalletChip]} 
              onPress={() => setSelectedWalletId(w.id)}
            >
              <Text style={[styles.walletChipText, selectedWalletId === w.id && styles.activeWalletChipText]}>
                {w.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <FlatList
          data={transactionsGroupedByDate} 
          renderItem={renderTransactionSection} 
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions found.</Text>
          }
        />
      </View>

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/transaction')}
      >
        <Plus color="#fff" size={30} />
      </TouchableOpacity>
    </View>
  );
}

// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#FFC107',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  balanceLabel: { fontSize: 14, opacity: 0.7, marginBottom: 5, fontWeight: '600' },
  balanceValue: { fontSize: 34, fontWeight: 'bold', marginBottom: 20 },
  
  walletSelector: { marginTop: 10 },
  walletChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  activeWalletChip: {
    backgroundColor: '#000',
  },
  walletChipText: { fontWeight: '600', color: '#333' },
  activeWalletChipText: { color: '#FFC107' },

  listContainer: { flex: 1 },
  dateGroup: {
    marginBottom: 20, 
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12, 
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconPlaceholder: {
    width: 48, height: 48, backgroundColor: '#f8f8f8', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center'
  },
  transTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  transDesc: { fontSize: 13, color: '#888' },
  transAmount: { fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  }
});