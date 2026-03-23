import React, { useEffect, useState } from 'react';
import {
    Text, View, FlatList, ActivityIndicator, TouchableOpacity,
    Alert, TextInput, Keyboard, KeyboardAvoidingView, Platform,
    ScrollView, Modal, StyleSheet
} from 'react-native';
import axios from 'axios';
import { globalStyles as styles } from './styles';

const API_BASE_URL = 'https://dependence-paris-safe-male.trycloudflare.com';

export default function App() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStockName, setNewStockName] = useState('');
    const [displayedPrice, setDisplayedPrice] = useState('');
    const [totalValue, setTotalValue] = useState(0);

    // [모달 관련 상태]
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTicker, setSelectedTicker] = useState(null);
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState(''); // 나중에 AI 요약 담을 곳

    const refreshData = async () => {
        try {
            setLoading(true);
            const [stocksRes] = await Promise.all([axios.get(`${API_BASE_URL}/stocks`)]);
            setStocks(stocksRes.data);
            const sum = stocksRes.data.reduce((acc, cur) => acc + (cur.purchase_price * (cur.quantity || 1)), 0);
            setTotalValue(sum);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const openNewsModal = async (ticker) => {
        setSelectedTicker(ticker);
        setIsModalVisible(true);
        setAiSummary(''); // 이전 요약 초기화

        try {
            setNewsLoading(true);
            const response = await axios.get(`${API_BASE_URL}/stocks/${ticker}/news`);
            setNews(response.data.news);
        } catch (error) {
            console.error(error);
            setNews([]);
        } finally {
            setNewsLoading(false);
        }
    };

    // (나머지 handlePriceChange, fetchRealtimePrice, addStock, deleteStock 함수는 동일하게 유지)
    const handlePriceChange = (text) => {
        const cleanNumber = text.replace(/,/g, '');
        if (cleanNumber && isNaN(cleanNumber)) return;
        const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        setDisplayedPrice(formatted);
    };

    const fetchRealtimePrice = async () => {
        if (!newStockName) { Alert.alert("알림", "티커를 입력해주세요."); return; }
        try {
            const response = await axios.get(`${API_BASE_URL}/stocks/price/${newStockName.toUpperCase()}`);
            const price = response.data.price_krw.toString();
            Alert.alert("조회 성공", `현재가: ${Number(price).toLocaleString()}원`, [
                { text: "취소" }, { text: "입력", onPress: () => handlePriceChange(price) }
            ]);
        } catch (e) { Alert.alert("에러", "조회 실패"); }
    };

    const addStock = async () => {
        const rawPrice = displayedPrice.replace(/,/g, '');
        if (!newStockName || !rawPrice) return;
        try {
            await axios.post(`${API_BASE_URL}/stocks`, {
                ticker: newStockName.toUpperCase(), name: newStockName.trim(),
                purchase_price: Number(rawPrice), quantity: 1.0
            });
            setNewStockName(''); setDisplayedPrice(''); refreshData();
        } catch (e) { Alert.alert("에러", "추가 실패"); }
    };

    const deleteStock = async (id) => {
        try { await axios.delete(`${API_BASE_URL}/stocks/${id}`); refreshData(); } catch (e) { console.error(e); }
    };

    useEffect(() => { refreshData(); }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>StockFlow 리스트 📈</Text>

            {/* 자산 요약 및 입력 UI (기존과 동일) */}
            <View style={{ padding: 15 }}>
                <TextInput placeholder="TSLA" value={newStockName} onChangeText={setNewStockName} style={{ borderBottomWidth: 1, padding: 5, marginBottom: 10 }} />
                <TouchableOpacity onPress={fetchRealtimePrice} style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 5, marginBottom: 5 }}><Text style={{ color: '#fff', textAlign: 'center' }}>현재가 조회</Text></TouchableOpacity>
                <TextInput placeholder="가격" value={displayedPrice} onChangeText={handlePriceChange} keyboardType="numeric" style={{ borderBottomWidth: 1, padding: 5, marginBottom: 10 }} />
                <TouchableOpacity onPress={addStock} style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 5 }}><Text style={{ color: '#fff', textAlign: 'center' }}>추가</Text></TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, margin: 15 }}>
                <Text style={{ color: '#888' }}>내 총 자산 (KRW)</Text>
                <Text style={{ color: '#00FF41', fontSize: 24, fontWeight: 'bold' }}>₩ {Number(totalValue).toLocaleString()}</Text>
            </View>

            {/* 주식 리스트 */}
            <FlatList
                data={stocks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.stockItem} onPress={() => openNewsModal(item.ticker)}>
                        <View>
                            <Text style={styles.stockName}>{item.name} ({item.ticker})</Text>
                            <Text>{Number(item.purchase_price).toLocaleString()}원</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteStock(item.id)}><Text style={{ color: 'red' }}>삭제</Text></TouchableOpacity>
                    </TouchableOpacity>
                )}
            />

            {/* [뉴스 & AI 요약 모달] */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ height: '70%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{selectedTicker} 인사이트</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}><Text style={{ fontSize: 18, color: '#666' }}>닫기</Text></TouchableOpacity>
                        </View>

                        <ScrollView>
                            {/* AI 요약 영역 (다음 단계) */}
                            <View style={{ backgroundColor: '#F0F7FF', padding: 15, borderRadius: 10, marginBottom: 20 }}>
                                <Text style={{ fontWeight: 'bold', color: '#007AFF', marginBottom: 5 }}>🤖 AI 3분 요약</Text>
                                <Text style={{ fontSize: 14, lineHeight: 20 }}>
                                    {aiSummary || "뉴스를 기반으로 분석을 준비 중입니다. (다음 단계에서 연결 예정)"}
                                </Text>
                            </View>

                            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>최신 뉴스원문</Text>
                            {newsLoading ? <ActivityIndicator /> : news.map((n, i) => (
                                <View key={i} style={{ marginBottom: 10, borderBottomWidth: 0.5, borderColor: '#eee', pb: 5 }}>
                                    <Text style={{ fontSize: 14 }}>{n.title}</Text>
                                    <Text style={{ fontSize: 12, color: '#999' }}>
                                        {n.publisher} • {n.published_at ? n.published_at.substring(0, 10) : "날짜 정보 없음"}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}