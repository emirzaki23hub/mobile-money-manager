import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';

// Define the Wallet Type for TypeScript safety
type Wallet = {
  id: number;
  name: string;
  type: string;
  balance: number;
};

export default function Transaction() {
  const router = useRouter();
  
  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  
  // Wallet Selection State
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);

  // 1. Fetch Wallets when screen loads
  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const res = await api('/wallets');
      if (res) {
        setWallets(res);
        // If user has wallets, auto-select the first one
        if (res.length > 0) {
          setSelectedWalletId(res[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load wallets", error);
    }
  };

  const handleSubmit = async () => {
    // Basic Validation
    if (!amount || !category || !selectedWalletId) {
      Alert.alert("Missing Data", "Please enter Amount, Category, and select a Wallet.");
      return;
    }

    setLoading(true);
    try {
      // 2. Send Data to API
      await api('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseInt(amount), // Convert string "50000" to number 50000
          type,                     // 'income' or 'expense'
          category,
          description: desc,
          walletId: selectedWalletId,
          date: new Date().toISOString() // Use current time
        })
      });
      
      // 3. Success! Go back to Dashboard
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      
      {/* Income / Expense Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, type === 'income' && styles.activeTab]} 
          onPress={() => setType('income')}
        >
          <Text style={[styles.tabText, type === 'income' && styles.activeTabText]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, type === 'expense' && styles.activeTab]} 
          onPress={() => setType('expense')}
        >
          <Text style={[styles.tabText, type === 'expense' && styles.activeTabText]}>Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* Amount Input */}
        <Text style={styles.label}>Amount (Rp)</Text>
        <TextInput 
          style={[styles.input, styles.amountInput]} 
          keyboardType="numeric"
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          autoFocus={true}
        />

        {/* Category Input */}
        <Text style={styles.label}>Category</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Food, Salary, Transport"
          value={category}
          onChangeText={setCategory}
        />

        {/* Wallet Selector (Horizontal Scroll) */}
        <Text style={styles.label}>Select Wallet</Text>
        <View style={{ height: 50 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
            {wallets.map((w) => (
              <TouchableOpacity 
                key={w.id}
                style={[styles.walletChip, selectedWalletId === w.id && styles.activeWalletChip]}
                onPress={() => setSelectedWalletId(w.id)}
              >
                <Text style={[styles.walletText, selectedWalletId === w.id && styles.activeWalletText]}>
                  {w.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {wallets.length === 0 && (
              <Text style={styles.noWalletText}>
                No wallets found. Please create one on the Dashboard first.
              </Text>
            )}
          </ScrollView>
        </View>

        {/* Description Input */}
        <Text style={styles.label}>Note</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Description (Optional)"
          value={desc}
          onChangeText={setDesc}
        />

        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.saveBtn, 
            type === 'expense' ? { backgroundColor: '#000' } : { backgroundColor: '#4CAF50' }
          ]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>SAVE TRANSACTION</Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#f9f9f9', margin: 20, borderRadius: 15, padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontWeight: '600', color: '#999' },
  activeTabText: { color: '#000' },
  
  // Form
  form: { paddingHorizontal: 25 },
  label: { fontSize: 13, fontWeight: '700', color: '#888', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  
  input: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    fontSize: 17, 
    paddingVertical: 10,
    marginBottom: 5,
    color: '#000'
  },
  amountInput: { fontSize: 32, fontWeight: 'bold', color: '#000' },

  // Wallet Selector
  walletRow: { flexDirection: 'row', marginBottom: 10 },
  walletChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  activeWalletChip: { backgroundColor: '#000', borderColor: '#000' },
  walletText: { fontWeight: '600', color: '#666' },
  activeWalletText: { color: '#FFC107' }, // Yellow text on black background
  noWalletText: { color: '#999', fontStyle: 'italic', marginTop: 8 },

  // Button
  saveBtn: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  btnText: { fontWeight: '800', fontSize: 16, color: '#fff' }
});