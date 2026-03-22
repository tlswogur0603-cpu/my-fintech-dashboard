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

// 백엔드 서버 주소 (현재 활성화된 터널 주소)
const API_BASE_URL = 'https://mitsubishi-ace-effort-makeup.trycloudflare.com';

export default function App() {
    const [stocks, setStocks] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [newStockName, setNewStockName] = useState(''); 
    const [displayedPrice, setDisplayedPrice] = useState(''); 
    const [totalValue, setTotalValue] = useState(0); 

    // 1. 데이터 새로고침 (경로에 /stocks 추가)
    const refreshData = async () => {
        try {
            setLoading(true);
            // 리스트와 포트폴리오를 가져올 때 모두 /stocks 경로를 거치도록 수정
            const [stocksRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/stocks`), 
            ]);

            console.log("LOG: 데이터 동기화 성공", stocksRes.data);
            setStocks(stocksRes.data);

            // 총 자산 계산 (서버에서 합계 API가 안될 경우를 대비해 프론트에서 임시 계산)
            const sum = stocksRes.data.reduce((acc, cur) => acc + (cur.purchase_price * (cur.quantity || 1)), 0);
            setTotalValue(sum);

        } catch (error) {
            console.error("데이터 동기화 실패:", error);
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

    // 2. 실시간 가격 조회 (경로에 /stocks/price 추가)
    const fetchRealtimePrice = async () => {
        if (!newStockName) {
            Alert.alert("알림", "티커를 입력해주세요.");
            return;
        }
        try {
            // 백엔드 라우터 구조상 /stocks/price 가 맞을 확률이 높습니다.
            const response = await axios.get(`${API_BASE_URL}/stocks/price/${newStockName.toUpperCase()}`);
            const price = response.data.price_krw.toString();

            Alert.alert(
                "실시간 가격 조회",
                `현재가: ${Number(price).toLocaleString()}원\n자동 입력할까요?`,
                [
                    { text: "아니오", style: "cancel" },
                    { text: "예", onPress: () => handlePriceChange(price) }
                ]
            );
        } catch (error) {
            console.error("주가 조회 에러:", error);
            Alert.alert("에러", "주가 정보를 가져올 수 없습니다. (주소 확인 필요)");
        }
    };

    // 3. 종목 추가 (경로에 /stocks 추가)
    const addStock = async () => {
        const rawPrice = displayedPrice.replace(/,/g, '');
        if (!newStockName || !rawPrice) {
            Alert.alert("알림", "종목명과 가격을 입력해주세요.");
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/stocks`, {
                ticker: newStockName.toUpperCase(),
                name: newStockName.trim(),
                purchase_price: Number(rawPrice),
                quantity: 1.0 
            });

            setNewStockName('');
            setDisplayedPrice('');
            Keyboard.dismiss();
            await refreshData();
            Alert.alert("성공", "종목이 추가되었습니다.");
        } catch (error) {
            Alert.alert("에러", "추가 실패");
        }
    };

    // 4. 종목 삭제 (경로에 /stocks 추가)
    const deleteStock = async (stock_id) => {
        try {
            await axios.delete(`${API_BASE_URL}/stocks/${stock_id}`);
            await refreshData();
            Alert.alert("성공", "삭제되었습니다.");
        } catch (error) {
            console.error("삭제 실패:", error);
        }
    };

    useEffect(() => {
        refreshData();
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

            <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, elevation: 2 }}>
                <TextInput
                    placeholder="종목명 입력 (예: TSLA)"
                    value={newStockName}
                    onChangeText={setNewStockName}
                    style={{ borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10 }}
                />
                <TouchableOpacity
                    onPress={fetchRealtimePrice}
                    style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>🔍 현재가 조회</Text>
                </TouchableOpacity>
                <TextInput
                    placeholder="가격 입력"
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

            <View style={{
                backgroundColor: '#1E1E1E',
                padding: 20,
                borderRadius: 15,
                marginHorizontal: 15,
                marginBottom: 15,
                elevation: 5
            }}>
                <Text style={{ color: '#888', fontSize: 14, marginBottom: 5 }}>내 총 자산 (KRW)</Text>
                <Text style={{ color: '#00FF41', fontSize: 28, fontWeight: 'bold' }}>
                    ₩ {Number(totalValue).toLocaleString()}
                </Text>
            </View>

            <FlatList
                data={stocks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.stockItem}>
                        <View>
                            <Text style={styles.stockName}>{item.name} ({item.ticker})</Text>
                            <Text style={styles.price}>{Number(item.purchase_price).toLocaleString()}원</Text>
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