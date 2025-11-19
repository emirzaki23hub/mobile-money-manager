import { api } from '@/services/api';
import { format } from 'date-fns/format';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

// Configure locale for calendar (optional, but good practice)
LocaleConfig.locales['en'] = {
    monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ],
    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    today: 'Today',
};
LocaleConfig.defaultLocale = 'en';

// Define the transaction type (matching your dashboard)
type TransactionItem = {
    id: number;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description?: string;
    date: number; 
    walletName: string;
    categoryName: string;
};

// Define the structure for marked dates
type MarkedDates = {
    [date: string]: {
        dots: Array<{ color: string }>;
        selected?: boolean;
        selectedColor?: string;
    };
};


export default function CalendarScreen() {
    // Stores all transactions for the currently viewed month
    const [transactionsByMonth, setTransactionsByMonth] = useState<TransactionItem[]>([]);
    // Stores transactions for the single day selected
    const [selectedDayTransactions, setSelectedDayTransactions] = useState<TransactionItem[]>([]);
    
    // The date the user has tapped on
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    // The month currently shown on the calendar
    const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    
    // Derived state for calendar markings
    const markedDates = generateMarkedDates(transactionsByMonth, selectedDate);
    
    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(amount);
    };


    // --- Data Fetching ---

    const loadTransactionsForMonth = useCallback(async (dateString: string) => {
        // We need to pass the start/end date of the month to the API. 
        // NOTE: Your backend API needs to support date range filtering.
        // For now, we will use a simplified call and filter on the frontend (less efficient).
        // Best practice is to modify the API to accept start_date and end_date.

        // Assuming your backend GET /transactions returns ALL transactions
        try {
            const res: TransactionItem[] = await api('/transactions'); 
            if (res) {
                // Filter transactions to only include those in the current month
                const startOfMonth = format(new Date(dateString), 'yyyy-MM');

                const monthTransactions = res.filter(t => {
                    // Convert UNIX timestamp to date string (e.g., '2025-11-20')
                    const transactionDateStr = format(new Date(t.date), 'yyyy-MM'); 
                    return transactionDateStr === startOfMonth;
                });
                
                setTransactionsByMonth(monthTransactions);

                // Update selected day transactions after fetching the month's data
                const dayTransactions = monthTransactions.filter(t => 
                    format(new Date(t.date), 'yyyy-MM-dd') === selectedDate
                );
                setSelectedDayTransactions(dayTransactions.sort((a, b) => b.date - a.date));
            }
        } catch (error) {
            console.error("Failed to load transactions for month", error);
        }
    }, [selectedDate]); // Add selectedDate to dependency array to re-filter transactions

    
    useFocusEffect(
        useCallback(() => {
            // Load data when the screen gains focus
            loadTransactionsForMonth(currentMonth);
        }, [currentMonth, loadTransactionsForMonth])
    );
    
    
    const handleDayPress = (day: DateData) => {
        const newDate = day.dateString;
        setSelectedDate(newDate);

        // Filter transactionsByMonth for the newly selected day
        const dayTransactions = transactionsByMonth.filter(t => 
            format(new Date(t.date), 'yyyy-MM-dd') === newDate
        );
        setSelectedDayTransactions(dayTransactions.sort((a, b) => b.date - a.date));
    };
    
    const handleMonthChange = (month: DateData) => {
        // When the user swipes to a new month, update the state and fetch new data
        setCurrentMonth(month.dateString); 
        setSelectedDayTransactions([]); // Clear daily transactions 
        setSelectedDate(month.dateString); // Reset selected date to the 1st of the new month
    };


    // --- Helper to render markings for the calendar ---
    function generateMarkedDates(data: TransactionItem[], selectedDay: string): MarkedDates {
        const markings: MarkedDates = {};

        // 1. Mark days that have transactions
        data.forEach(item => {
            const dateStr = format(new Date(item.date), 'yyyy-MM-dd');
            
            if (!markings[dateStr]) {
                markings[dateStr] = { dots: [] };
            }

            // Only add a dot if the day doesn't already have one of that type
            const dotColor = item.type === 'income' ? '#4CAF50' : '#FF6347';
            if (!markings[dateStr].dots.some(dot => dot.color === dotColor)) {
                 markings[dateStr].dots.push({ color: dotColor });
            }
        });

        // 2. Mark the currently selected day
        markings[selectedDay] = {
            ...markings[selectedDay],
            selected: true,
            selectedColor: '#FFC107', // Your primary color
        };

        return markings;
    }


    // --- Render Components ---

    const renderTransactionItem = ({ item }: { item: TransactionItem }) => (
        <View style={styles.transactionItem}>
            <View style={{ flex: 1 }}>
                <Text style={styles.transTitle}>{item.categoryName}</Text>
                <Text style={styles.transDesc}>{item.description || 'No note'}</Text>
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
            <Calendar
                // Initial date to show (can be current date)
                current={currentMonth}
                
                // When a day is pressed
                onDayPress={handleDayPress}
                
                // When the month changes (swipe left/right)
                onMonthChange={handleMonthChange}
                
                // Configuration for the marked dates
                markedDates={markedDates}
                markingType={'multi-dot'}

                theme={{
                    selectedDayBackgroundColor: '#FFC107',
                    todayTextColor: '#007AFF',
                    arrowColor: '#FFC107',
                }}
            />

            {/* Daily Transactions List */}
            <View style={styles.dailyListContainer}>
                <Text style={styles.listHeader}>
                    Transactions on {format(new Date(selectedDate), 'MMM dd, yyyy')}
                </Text>
                
                <FlatList
                    data={selectedDayTransactions}
                    renderItem={renderTransactionItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No transactions on this date.</Text>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    dailyListContainer: {
        flex: 1,
        marginTop: 10,
    },
    listHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    
    // Transaction Item Styles (copied from Dashboard for consistency)
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
    transTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    transDesc: { fontSize: 13, color: '#888' },
    transAmount: { fontSize: 16, fontWeight: '700' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 16 },
});