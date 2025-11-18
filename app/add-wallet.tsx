import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';

export default function AddWallet() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'ewallet'>('cash');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert("Missing Name", "Please enter a wallet name (e.g. BCA)");
      return;
    }

    setLoading(true);
    try {
      await api('/wallets', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          balance: balance ? parseInt(balance) : 0,
        })
      });
      Alert.alert("Success", "Wallet created successfully!");
      router.back(); // Go back to dashboard
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        
        <Text style={styles.label}>Wallet Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. BCA, OVO, Cash"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Initial Balance (Rp)</Text>
        <TextInput 
          style={styles.input} 
          keyboardType="numeric"
          placeholder="0"
          value={balance}
          onChangeText={setBalance}
        />

        <Text style={styles.label}>Wallet Type</Text>
        <View style={styles.typeContainer}>
          {['cash', 'bank', 'ewallet'].map((t) => (
            <TouchableOpacity 
              key={t}
              style={[styles.typeBtn, type === t && styles.activeTypeBtn]} 
              onPress={() => setType(t as any)}
            >
              <Text style={[styles.typeText, type === t && styles.activeTypeText]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>CREATE WALLET</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 8 },
  input: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd', 
    fontSize: 16, 
    paddingVertical: 10,
    marginBottom: 5
  },
  typeContainer: { flexDirection: 'row', gap: 10, marginTop: 5 },
  typeBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee'
  },
  activeTypeBtn: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#666' },
  activeTypeText: { color: '#000' },
  saveBtn: {
    backgroundColor: '#FFC107',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  btnText: { fontWeight: 'bold', fontSize: 16 }
});