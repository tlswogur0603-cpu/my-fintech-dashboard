import React, { useEffect, useState } from 'react';
import {
    Text, View, FlatList, ActivityIndicator, TouchableOpacity,
    Alert, TextInput, Keyboard, KeyboardAvoidingView, Platform,
    ScrollView, Modal
} from 'react-native'; 
import axios from 'axios';
import { globalStyles as styles } from './styles'; // 외부 스타일 시트 불러오기
import Markdown from 'react-native-markdown-display'; // 마크다운 렌더링 라이브러리

// 백엔드 API 주소 (Cloudflare 터널 주소)
const API_BASE_URL = 'https://ran-fitness-training-lottery.trycloudflare.com';

export default function App() {
    // --- [상태 관리: State] ---
    const [stocks, setStocks] = useState([]);          // 주식 리스트 저장
    const [loading, setLoading] = useState(true);        // 전체 로딩 상태
    const [newStockName, setNewStockName] = useState(''); // 입력창: 티커명
    const [displayedPrice, setDisplayedPrice] = useState(''); // 입력창: 가격(콤마 포함)
    const [totalValue, setTotalValue] = useState(0);      // 총 자산 합계

    // --- [모달 및 AI 관련 상태] ---
    const [isModalVisible, setIsModalVisible] = useState(false); // 모달 표시 여부
    const [selectedTicker, setSelectedTicker] = useState(null);  // 선택된 주식 티커
    const [news, setNews] = useState([]);                        // 뉴스 리스트
    const [newsLoading, setNewsLoading] = useState(false);       // 뉴스/AI 로딩 상태
    const [aiSummary, setAiSummary] = useState('');              // AI 요약 텍스트

    // --- [함수: 데이터 가져오기] ---
    const refreshData = async () => {
        try {
            setLoading(true);
            // 백엔드에서 주식 목록 가져오기
            const [stocksRes] = await Promise.all([axios.get(`${API_BASE_URL}/stocks`)]);
            setStocks(stocksRes.data);
            
            // 총 자산 계산 (가격 * 수량)
            const sum = stocksRes.data.reduce((acc, cur) => acc + (cur.purchase_price * (cur.quantity || 1)), 0);
            setTotalValue(sum);
        } catch (error) { 
            console.error("데이터 불러오기 실패:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    // --- [함수: 뉴스 모달 열기 및 AI 요약 요청] ---
    const openNewsModal = async (ticker) => {
        setSelectedTicker(ticker);
        setIsModalVisible(true); // 모달창 열기
        setAiSummary('');        // 이전 요약 내용 초기화

        try {
            setNewsLoading(true);
            // 백엔드의 AI 뉴스 분석 엔드포인트 호출
            const response = await axios.get(`${API_BASE_URL}/stocks/${ticker}/news`);
            setNews(response.data.news || []);
            setAiSummary(response.data.ai_summary || 'AI 요약이 없습니다.');
        } catch (error) {
            console.error("뉴스 로딩 실패:", error);
            setNews([]);
            setAiSummary('AI 요약을 가져오는 중 오류가 발생했습니다.');
        } finally {
            setNewsLoading(false);
        }
    };

    // --- [함수: 가격 입력 시 콤마 처리] ---
    const handlePriceChange = (text) => {
        const cleanNumber = text.replace(/,/g, ''); // 콤마 제거
        if (cleanNumber && isNaN(cleanNumber)) return; // 숫자 아니면 무시
        const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 3자리마다 콤마
        setDisplayedPrice(formatted);
    };

    // --- [함수: 실시간 가격 조회] ---
    const fetchRealtimePrice = async () => {
        if (!newStockName) { Alert.alert("알림", "티커를 입력해주세요."); return; }
        try {
            const response = await axios.get(`${API_BASE_URL}/stocks/price/${newStockName.toUpperCase()}`);
            const price = response.data.price_krw.toString();
            Alert.alert("조회 성공", `현재가: ${Number(price).toLocaleString()}원`, [
                { text: "취소" }, 
                { text: "입력", onPress: () => handlePriceChange(price) } // 확인 누르면 입력창에 자동 입력
            ]);
        } catch (e) { Alert.alert("에러", "조회 실패"); }
    };

    // --- [함수: 주식 추가] ---
    const addStock = async () => {
        const rawPrice = displayedPrice.replace(/,/g, '');
        if (!newStockName || !rawPrice) return;
        try {
            await axios.post(`${API_BASE_URL}/stocks`, {
                ticker: newStockName.toUpperCase(),
                name: newStockName.trim(),
                purchase_price: Number(rawPrice),
                quantity: 1.0
            });
            setNewStockName(''); 
            setDisplayedPrice(''); 
            refreshData(); // 리스트 새로고침
        } catch (e) { Alert.alert("에러", "추가 실패"); }
    };

    // --- [함수: 주식 삭제] ---
    const deleteStock = async (id) => {
        try { 
            await axios.delete(`${API_BASE_URL}/stocks/${id}`); 
            refreshData(); 
        } catch (e) { console.error(e); }
    };

    // 앱 시작 시 데이터 로드
    useEffect(() => { refreshData(); }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>StockFlow 리스트 📈</Text>

            {/* 주식 입력 섹션 */}
            <View style={{ padding: 15 }}>
                <TextInput placeholder="TSLA" value={newStockName} onChangeText={setNewStockName} style={{ borderBottomWidth: 1, padding: 5, marginBottom: 10 }} />
                <TouchableOpacity onPress={fetchRealtimePrice} style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 5, marginBottom: 5 }}>
                    <Text style={{ color: '#fff', textAlign: 'center' }}>현재가 조회</Text>
                </TouchableOpacity>
                <TextInput placeholder="가격" value={displayedPrice} onChangeText={handlePriceChange} keyboardType="numeric" style={{ borderBottomWidth: 1, padding: 5, marginBottom: 10 }} />
                <TouchableOpacity onPress={addStock} style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 5 }}>
                    <Text style={{ color: '#fff', textAlign: 'center' }}>추가</Text>
                </TouchableOpacity>
            </View>

            {/* 총 자산 표시 카드 */}
            <View style={{ backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, margin: 15 }}>
                <Text style={{ color: '#888' }}>내 총 자산 (KRW)</Text>
                <Text style={{ color: '#00FF41', fontSize: 24, fontWeight: 'bold' }}>₩ {Number(totalValue).toLocaleString()}</Text>
            </View>

            {/* 메인 주식 리스트 */}
            <FlatList
                data={stocks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.stockItem} onPress={() => openNewsModal(item.ticker)}>
                        <View>
                            <Text style={styles.stockName}>{item.name} ({item.ticker})</Text>
                            <Text style={styles.price}>{Number(item.purchase_price).toLocaleString()}원</Text>
                        </View>
                        {/* 삭제 버튼: styles.js에 정의한 스타일 사용 */}
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteStock(item.id)}>
                            <Text style={styles.deleteButtonText}>삭제</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />

            {/* [뉴스 & AI 요약 모달 창] */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ height: '75%', backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 }}>
                        
                        {/* 모달 헤더 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' }}>{selectedTicker} 인사이트</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '600' }}>닫기</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* 🤖 AI 애널리스트 브리핑 카드 */}
                            <View style={styles.aiCard}>
                                <Text style={styles.aiTitle}>🤖 AI 애널리스트 브리핑</Text>
                                <View style={{ height: 1, backgroundColor: '#D1E9FF', marginVertical: 10 }} />
                                
                                {newsLoading ? (
                                    <ActivityIndicator color="#007AFF" />
                                ) : (
                                    /* 마크다운 라이브러리를 사용해 AI 답변을 예쁘게 출력 */
                                    <Markdown
                                        style={{
                                            body: { color: '#334155', fontSize: 15, lineHeight: 22 },
                                            strong: { fontWeight: 'bold', color: '#000' } // 굵은 글씨 스타일링
                                        }}
                                    >
                                        {aiSummary}
                                    </Markdown>
                                )}
                            </View>

                            {/* 하단 뉴스 원문 리스트 */}
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>최신 뉴스원문</Text>
                            {newsLoading ? (
                                <ActivityIndicator />
                            ) : (
                                news.length === 0 || (news[0] && !news[0].title) ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#999' }}>현재 표시할 수 있는 뉴스가 없습니다. 📭</Text>
                                    </View>
                                ) : (
                                    news.map((n, i) => (
                                        n.title && (
                                            <View key={i} style={{ marginBottom: 15, paddingBottom: 10, borderBottomWidth: 0.5, borderColor: '#EEE' }}>
                                                <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1A1A', marginBottom: 5 }}>{n.title}</Text>
                                                <Text style={{ fontSize: 12, color: '#999' }}>
                                                    {n.publisher} • {n.published_at ? n.published_at.substring(0, 10) : "날짜 정보 없음"}
                                                </Text>
                                            </View>
                                        )
                                    ))
                                )
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}