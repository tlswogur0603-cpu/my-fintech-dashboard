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

    const fetchRealtimePrice = async () => {
        if (!newStockName) {
            Alert.alert("알림", "티커를 입력해주세요. (예: AAPL)");
            return;
        }

        try {
            const response = await axios.get(`http://192.168.75.233/api/stocks/price/${newStockName.toUpperCase()}`);
            const price = response.data.price_krw.toString();

            Alert.alert(
                "실시간 가격 조회",
                `현재 시장가: ${Number(price).toLocaleString()}원\n이 가격을 매수가로 입력할까요?`,
                [
                    { text: "아니오 (직접 입력)", style: "cancel" },
                    {
                        text: "예 (자동 입력)",
                        onPress: () => handlePriceChange(price) // 여기서 가격이 자동 세팅됩니다.
                    }
                ]
            );
        } catch (error) {
            console.error("가격 조회 실패:", error);
            Alert.alert("에러", "주가 정보를 가져올 수 없습니다. 티커를 확인해주세요.");
        }
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
                    placeholder="종목명 입력 (예: 005930.KS)"
                    value={newStockName}
                    onChangeText={setNewStockName}
                    style={{ borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10 }}
                />
                <TouchableOpacity
                    onPress={fetchRealtimePrice}
                    style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>🔍 현재가 조회 (한국은 .KS 붙이기)</Text>
                </TouchableOpacity>
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