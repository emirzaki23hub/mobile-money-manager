import { api } from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- Type Definitions ---
type Wallet = {
  id: number;
  name: string;
  type: string;
  balance: number;
};

type Category = {
  id: number;
  name: string;
};

// --- Helper for Date Formatting ---
// Used for displaying the time in the UI
const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
};

export default function Transaction() {
  const router = useRouter();
  // ⭐️ Get parameters from the URL (transactionId) ⭐️
  const { transactionId } = useLocalSearchParams();
  const idToEdit = transactionId ? Number(transactionId) : null;
  
  // --- Form State ---
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  
  // ⭐️ DATE & TIME STATE ⭐️
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false); 
  const [showTimePicker, setShowTimePicker] = useState(false); 
  
  // --- Data & Selection State ---
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [originalTransaction, setOriginalTransaction] = useState<any>(null); // Store fetched data

  // --- Data Loading Functions ---

  const loadCategories = useCallback(async (currentType: 'income' | 'expense') => {
    try {
      const url = `/categories?type=${currentType}`;
      const res = await api(url);

      if (res) {
        setCategories(res);
        // Logic to maintain selection in edit mode or reset on type switch
        if (idToEdit && originalTransaction && currentType === originalTransaction.type) {
            setSelectedCategoryId(originalTransaction.categoryId);
        } else {
            setSelectedCategoryId(null); 
        }
      }
    } catch (error) {
      console.error(`Failed to load ${currentType} categories`, error);
    }
  }, [idToEdit, originalTransaction]);

  const loadWallets = async () => {
    try {
      const res = await api('/wallets');
      if (res && res.length > 0) {
        setWallets(res);
        // Only set default wallet if no wallet is already selected (e.g. from an edit load)
        if (selectedWalletId === null) {
             setSelectedWalletId(res[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load wallets", error);
    }
  };

  // ⭐️ Load existing transaction data for editing ⭐️
  const loadTransactionToEdit = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await api(`/transactions/${id}`);
      if (res) {
        setOriginalTransaction(res); 

        // 1. Set form fields
        setType(res.type);
        setAmount(String(res.amount)); 
        setDesc(res.description || '');
        
        // 2. Set date and time
        const apiDate = new Date(res.date); 
        setDate(apiDate);
        
        // 3. Set selections
        setSelectedWalletId(res.walletId);
        setSelectedCategoryId(res.categoryId);
        
        // Update router title to reflect "Edit" mode
        router.setParams({ title: 'Edit Transaction' }); 
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load transaction for editing.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);


  // --- Effects ---

  useEffect(() => {
    loadWallets();
  }, []);
  
  // Effect to load edit data or set initial title
  useEffect(() => {
    if (idToEdit) {
        loadTransactionToEdit(idToEdit);
    } else {
        router.setParams({ title: 'Add Transaction' });
    }
  }, [idToEdit, loadTransactionToEdit, router]);
  
  useEffect(() => {
    // Only load categories after the initial load of originalTransaction is complete in edit mode
    if (!idToEdit || originalTransaction) {
        loadCategories(type);
    }
  }, [type, loadCategories, idToEdit, originalTransaction]); // Added originalTransaction dependency


  // --- Handlers ---
  
  // Handles date and time selection
  const onDateTimeChange = (event: any, selectedDateTime?: Date, mode: 'date' | 'time' = 'date') => {
    if (Platform.OS === 'android') {
        if (mode === 'date') setShowDatePicker(false);
        if (mode === 'time') setShowTimePicker(false);
    }
    
    if (event.type === 'set' && selectedDateTime) {
      setDate(prevDate => {
        let newDate = new Date(prevDate.getTime());

        if (mode === 'date') {
          newDate.setFullYear(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate());
        } else if (mode === 'time') {
          newDate.setHours(selectedDateTime.getHours(), selectedDateTime.getMinutes());
        }
        
        return newDate;
      });
    }
  };
  
  const onDateChange = (event: any, selectedDate?: Date) => {
      onDateTimeChange(event, selectedDate, 'date');
  }
  
  const onTimeChange = (event: any, selectedTime?: Date) => {
      onDateTimeChange(event, selectedTime, 'time');
  }
  
  const handleTypeChange = (newType: 'income' | 'expense') => {
      setType(newType);
      setSelectedCategoryId(null); 
  };


  const handleSubmit = async () => {
    if (!amount || !selectedCategoryId || !selectedWalletId) {
      Alert.alert("Missing Data", "Please enter Amount, select a Category, and select a Wallet.");
      return;
    }

    setLoading(true);

    // ⭐️ Determine URL and Method based on edit mode ⭐️
    const url = idToEdit ? `/transactions/${idToEdit}` : '/transactions';
    const method = idToEdit ? 'PUT' : 'POST'; 
    
    try {
      await api(url, {
        method: method,
        body: JSON.stringify({
          amount: parseInt(amount), 
          type,                     
          categoryId: selectedCategoryId,
          description: desc,
          walletId: selectedWalletId,
          date: date.toISOString() // Send the selected full date/time
        })
      });
      
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || `Failed to ${idToEdit ? 'update' : 'save'} transaction`);
    } finally {
      setLoading(false);
    }
  };
  
  // ⭐️ NEW: Delete Handler ⭐️
  const handleDelete = () => {
    if (!idToEdit) return;

    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this transaction? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await api(`/transactions/${idToEdit}`, {
                method: 'DELETE',
              });
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete transaction.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // --- UI Rendering ---

  return (

    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      
      {/* Income / Expense Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, type === 'income' && styles.activeTab]} 
          onPress={() => handleTypeChange('income')}
          disabled={!!idToEdit} // Disable type change in edit mode for simplicity
        >
          <Text style={[styles.tabText, type === 'income' && styles.activeTabText]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, type === 'expense' && styles.activeTab]} 
          onPress={() => handleTypeChange('expense')}
          disabled={!!idToEdit} // Disable type change in edit mode
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
        
        {/* Date & Time Picker Fields (Combined) */}
        <Text style={styles.label}>Date & Time</Text>
        <View style={styles.dateTimeRow}>
            {/* Date Picker Button */}
            <TouchableOpacity 
                style={[styles.input, styles.dateInput, {flex: 2, marginRight: 10}]}
                onPress={() => setShowDatePicker(true)} 
            >
                <Text style={styles.dateText}>
                    {date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </Text>
            </TouchableOpacity>

            {/* Time Picker Button */}
            <TouchableOpacity 
                style={[styles.input, styles.dateInput, {flex: 1}]}
                onPress={() => setShowTimePicker(true)} 
            >
                <Text style={styles.dateText}>
                    {formatTime(date)}
                </Text>
            </TouchableOpacity>
        </View>

        {/* ⭐️ Date Picker Implementation ⭐️ */}
        {(showDatePicker || Platform.OS === 'ios') && (
            <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={onDateChange}
                maximumDate={new Date()} 
                style={Platform.OS === 'ios' ? styles.embeddedPicker : {}}
            />
        )}
        
        {/* ⭐️ Time Picker Implementation ⭐️ */}
        {(showTimePicker || Platform.OS === 'ios') && (
            <DateTimePicker
                value={date}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={onTimeChange}
                maximumDate={date.toDateString() === new Date().toDateString() ? new Date() : undefined} 
                style={Platform.OS === 'ios' ? styles.embeddedPicker : {}}
            />
        )}
        
        {/* Category Selector (Horizontal Scroll) */}
        <Text style={styles.label}>Select Category</Text>
        <View style={{ height: 50 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
            {categories.map((c) => (
              <TouchableOpacity 
                key={c.id}
                style={[styles.chip, selectedCategoryId === c.id && styles.activeCategoryChip]}
                onPress={() => setSelectedCategoryId(c.id)}
              >
                <Text style={[styles.chipText, selectedCategoryId === c.id && styles.activeCategoryText]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {categories.length === 0 && (
              <Text style={styles.noDataText}>
                No {type} categories found.
              </Text>
            )}
          </ScrollView>
        </View>
        
        {/* Wallet Selector (Horizontal Scroll) */}
        <Text style={styles.label}>Select Wallet</Text>
        <View style={{ height: 50, marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
            {wallets.map((w) => (
              <TouchableOpacity 
                key={w.id}
                style={[styles.chip, selectedWalletId === w.id && styles.activeWalletChip]}
                onPress={() => setSelectedWalletId(w.id)}
              >
                <Text style={[styles.chipText, selectedWalletId === w.id && styles.activeWalletText]}>
                  {w.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {wallets.length === 0 && (
              <Text style={styles.noDataText}>
                No wallets found.
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

        {/* Save/Update Button */}
        <TouchableOpacity 
          style={[
            styles.saveBtn, 
            idToEdit ? { backgroundColor: '#007AFF' } : (type === 'expense' ? { backgroundColor: '#FF6347' } : { backgroundColor: '#4CAF50' })
          ]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {idToEdit ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}
            </Text>
          )}
        </TouchableOpacity>
        
        {/* ⭐️ NEW: Delete Button (Visible only in Edit Mode) ⭐️ */}
        {idToEdit && (
            <TouchableOpacity 
              style={[styles.deleteBtn, { backgroundColor: '#DC3545' }]} 
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>
                  DELETE TRANSACTION
                </Text>
              )}
            </TouchableOpacity>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', margin: 20, borderRadius: 15, padding: 5 },
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
  
  // Date/Time Styling
  dateTimeRow: { 
      flexDirection: 'row', 
      marginBottom: 5,
  },
  dateInput: {
      flexDirection: 'row',
      justifyContent: 'center', 
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#f9f9f9', 
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#eee'
  },
  dateText: {
      fontSize: 15, 
      color: '#000',
      fontWeight: '600'
  },
  embeddedPicker: {
      marginTop: 10,
  },


  // Selector (Category/Wallet)
  selectorRow: { flexDirection: 'row', marginBottom: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  chipText: { fontWeight: '600', color: '#666' },
  
  // Wallet Styling
  activeWalletChip: { backgroundColor: '#000', borderColor: '#000' },
  activeWalletText: { color: '#FFC107' }, 

  // Category Styling (new)
  activeCategoryChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  activeCategoryText: { color: '#fff' },

  noDataText: { color: '#999', fontStyle: 'italic', marginTop: 8 },

  // Button
  saveBtn: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  
  // ⭐️ NEW: Delete Button Style ⭐️
  deleteBtn: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 50, // Added to provide spacing at the bottom
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  
  btnText: { fontWeight: '800', fontSize: 16, color: '#fff' }
});