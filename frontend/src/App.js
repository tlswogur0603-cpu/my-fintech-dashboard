import React, { useEffect, useState } from 'react';
import {
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
    Keyboard, 
    KeyboardAvoidingView, 
    Platform 
} from 'react-native';
import axios from 'axios';
import { globalStyles as styles } from './styles';

export default function App() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newStockName, setNewStockName] = useState('');
    const [displayedPrice, setDisplayedPrice] = useState('');

    const fetchStocks = async () => {
        try {
            const response = await axios.get('http://192.168.75.233/api/stocks');
            setStocks(response.data);
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (text) => {
        const cleanNumber = text.replace(/,/g, '');
        if (cleanNumber && isNaN(cleanNumber)) return;
        const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        setDisplayedPrice(formatted);
    };

    const addStock = async () => {
        const rawPrice = displayedPrice.replace(/,/g, '');

        if (!newStockName || !rawPrice) {
            Alert.alert("알림", "종목명과 가격을 모두 입력해주세요.");
            return;
        }

        try {
            await axios.post('http://192.168.75.233/api/stocks', {
                ticker: "TEST", 
                name: String(newStockName).trim(),
                purchase_price: Number(rawPrice),
                quantity: 1.0 
            });
            Alert.alert("성공", "새로운 종목이 추가되었습니다.");
            setNewStockName('');
            setDisplayedPrice('');
            Keyboard.dismiss(); 
            fetchStocks();
        } catch (error) {
            console.error("추가 실패:", error.response?.data);
            Alert.alert("에러", "데이터 형식을 확인해주세요.");
        }
    };

    const deleteStock = async (stock_id) => {
        try {
            await axios.delete(`http://192.168.75.233/api/stocks/${stock_id}`);
            Alert.alert("성공", "종목이 삭제되었습니다.");
            fetchStocks(); 
        } catch (error) {
            console.error("삭제 실패:", error);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Text style={styles.title}>StockFlow 리스트 📈</Text>

            <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}>
                <TextInput
                    placeholder="종목명 입력 (예: 삼성전자)"
                    value={newStockName}
                    onChangeText={setNewStockName}
                    style={{ borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10 }}
                />
                <TextInput
                    placeholder="가격 입력 (예: 195,000)"
                    value={displayedPrice}
                    onChangeText={handlePriceChange}
                    keyboardType="numeric"
                    style={{ borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10 }}
                />
                <TouchableOpacity 
                    onPress={addStock}
                    style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>종목 추가하기</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={stocks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.stockItem}>
                        <View>
                            <Text style={styles.stockName}>{item.name}</Text>
                            <Text style={styles.price}>{Number(item.purchase_price).toLocaleString('ko-KR')}원</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteStock(item.id)}
                        >
                            <Text style={styles.deleteButtonText}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </KeyboardAvoidingView>
    );
}