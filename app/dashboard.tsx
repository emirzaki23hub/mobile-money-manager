import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LogOut, Plus, Wallet } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';

export default function Dashboard() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
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

  // Filter transactions based on selected wallet
  const filteredTransactions = useMemo(() => {
    if (!selectedWalletId) return transactions;
    return transactions.filter(t => t.walletId === selectedWalletId);
  }, [selectedWalletId, transactions]);

  // Calculate balance for the selected view
  const currentBalance = useMemo(() => {
    if (!selectedWalletId) return totalBalance;
    // Calculate specific wallet balance from transaction history
    return filteredTransactions.reduce((acc, curr) => {
      return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [selectedWalletId, filteredTransactions, totalBalance]);

  const renderTransaction = ({ item }: any) => (
    <View style={styles.transactionItem}>
      <View style={styles.iconPlaceholder}>
        <Text style={{ fontSize: 20 }}>{item.type === 'income' ? '💰' : '💸'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.transTitle}>{item.category}</Text>
        <Text style={styles.transDesc}>
          {item.description || 'No description'} • {wallets.find(w => w.id === item.walletId)?.name}
        </Text>
      </View>
      <Text style={[
        styles.transAmount, 
        { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
      ]}>
        {item.type === 'income' ? '+' : '-'}{formatIDR(item.amount)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>My Money</Text>
          <View style={{ flexDirection: 'row', gap: 15 }}>
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
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions found.</Text>
          }
        />
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/transaction')}
      >
        <Plus color="#fff" size={30} />
      </TouchableOpacity>
    </View>
  );
}

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