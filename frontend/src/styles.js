import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5', 
        paddingTop: 50, 
        paddingHorizontal: 20 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        textAlign: 'center',
        color: '#333'
    },
    stockItem: { 
        backgroundColor: '#fff', 
        padding: 15, 
        borderRadius: 10, 
        marginBottom: 10, 
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        // 가로 배치를 위한 설정 추가
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    stockName: { 
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#007AFF'
    },
    price: {
        fontSize: 16,
        color: '#666',
        marginTop: 5
    },
    // 삭제 버튼 스타일 추가
    deleteButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    // ai 답변 ui
    aiCard: {
        backgroundColor: '#F0F7FF', 
        padding: 18, 
        borderRadius: 12, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#D1E9FF',
    },
    aiTitle: { 
        fontWeight: 'bold', 
        color: '#007AFF', 
        fontSize: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center'
    },
    markdownBody: {
        color: '#334155',
        fontSize: 14,
        lineHeight: 22,
    },
    markdownStrong: {
        fontWeight: 'bold',
        color: '#000',
    }
});