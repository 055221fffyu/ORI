import { useEffect, useState } from 'react'
import api from './api'

export default function Dashboard() {
    const [images, setImages] = useState([])
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(false)

    // 核心資料抓取函式
    const refreshData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("未偵測到登入 Token，跳過抓取");
            return;
        }

        try {
            // 同時抓取圖片列表與任務列表
            const [imgRes, taskRes] = await Promise.all([
                api.get('/images/'),
                api.get('/embed/')
            ]);
            
            setImages(imgRes.data);
            setTasks(taskRes.data);
        } catch (err) {
            console.error("資料抓取失敗:", err.response?.data?.detail || err.message);
            // 如果後端回傳 401，代表 Token 真的失效了
            if (err.response?.status === 401) {
                alert("連線逾時或認證失敗，請重新登入");
                localStorage.removeItem('token');
                window.location.reload(); // 強制回登入頁
            }
        }
    };

    // 控制自動更新的定時器
    useEffect(() => {
        refreshData(); // 初始載入

        const timer = setInterval(() => {
            // 檢查是否還有「非最終狀態」的任務
            const hasActiveTask = tasks.some(t => 
                t.status !== 'done' && t.status !== 'failed'
            );
            
            // 如果有任務在跑，或是目前列表是空的，就持續更新
            if (hasActiveTask || images.length === 0) {
                refreshData();
            }
        }, 3000);

        return () => clearInterval(timer);
    }, [tasks.length, images.length]); // 當列表長度改變時重置定時器

    // 處理圖片上傳
    const handleUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/images/upload', formData);
            refreshData();
        } catch (err) {
            // 重要：檢查 err.response.status 是否為 409
            if (err.response && err.response.status === 409) {
                const errorDetail = err.response.data.detail;
                alert(errorDetail.message || "這張圖片已經上傳過囉！");
            } else {
                console.error("上傳失敗", err);
                alert("上傳失敗：" + (err.response?.data?.detail || "未知錯誤"));
            }
        }
    };

    // 處理嵌入任務啟動
    const startEmbed = async (imageId) => {
        // 提醒使用者只能輸入 7 個字元
        const defaultSecret = generateRandomSecret();
        const secret = prompt(
            "請輸入剛好 7 位數的金鑰 (已為您預先隨機產生)：", 
            defaultSecret
        );
        
        // 驗證長度，避免再次觸發 422 錯誤
        if (secret === null) {
            console.log("使用者取消了任務提交");
            return; 
        }

        if (!secret.trim() || secret.length > 7) {
            alert("金鑰長度不符，請輸入 7 位以內的字元");
            return;
        }

        try {
            await api.post('/embed/', {
                image_id: imageId, 
                editguard_bits: "1100110011001100110011001100110011001100110011001100110011001100",
                stegastamp_secret: secret
            });
            alert("任務已提交，請稍候...");
            await refreshData();
        } catch (err) {
            // 這樣寫可以抓到後端具體的 422 報錯訊息（例如哪個欄位不對）
            const errorDetail = err.response?.data?.detail;
            const message = typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail;
            alert("啟動失敗: " + (message || "伺服器無回應"));
        }
    };

    // 產生隨機 7 位英數字金鑰的函式
    const generateRandomSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 7; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // 在你的組件邏輯中
    const [stegaSecret, setStegaSecret] = useState('Hello'); // 預設值

    // 當使用者點擊「隨機產生」按鈕時
    const handleRandomSecret = () => {
        const newSecret = generateRandomSecret();
        setStegaSecret(newSecret);
    };

    return (
        <div className="space-y-10">
            {/* 圖片管理區塊 */}
            <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black dark:text-white">圖片庫管理</h3>
                        <p className="text-xs text-gray-400">上傳圖片後即可嵌入浮水印</p>
                    </div>
                    <label className={`bg-primary text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:opacity-90 transition ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {loading ? '上傳中...' : '上傳新圖片'}
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => handleUpload(e.target.files[0])}
                            disabled={loading}
                        />
                    </label>
                </div>

                {images.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-2xl text-gray-400">
                        目前沒有圖片，請先上傳
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {images.map(img => (
                            <div key={img.id} className="group relative aspect-square bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden border dark:border-gray-600">
                                <img 
                                    src={img.blob_url.startsWith('http') ? img.blob_url : `${api.defaults.baseURL}${img.blob_url}`} 
                                    alt="upload" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <button onClick={() => startEmbed(img.id)} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm transform active:scale-95 transition">
                                        嵌入浮水印
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 任務進度區塊 */}
            <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-black mb-6 dark:text-white">浮水印任務進度</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 text-xs font-bold uppercase border-b dark:border-gray-700">
                                <th className="p-4">任務ID</th>
                                <th className="p-4">狀態</th>
                                <th className="p-4">結果與數據</th>
                            </tr>
                        </thead>
                        <tbody className="dark:text-gray-200">
                            {tasks.length === 0 ? (
                                <tr><td colSpan="3" className="p-10 text-center text-gray-400 italic">尚無執行中的任務</td></tr>
                            ) : (
                                tasks.map(t => (
                                    <tr key={t.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="p-4 font-mono text-[10px] text-gray-400">{t.id.substring(0, 8)}...</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                t.status === 'done' ? 'bg-green-100 text-green-700' : 
                                                t.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-orange-100 text-orange-600 animate-pulse'
                                            }`}>
                                                {t.status.toUpperCase()}
                                            </span>
                                        </td>
                                        {/* Dashboard.jsx 內部的表格單元格修正 */}
                                        <td className="p-4">
                                            {t.status === 'done' ? (
                                                <div className="flex gap-3 items-center">
                                                    {/* 下載按鈕：加入 download 屬性與樣式 */}
                                                    <a 
                                                        href={t.result_image_url} 
                                                        download={`watermarked_${t.id.substring(0,5)}.png`}
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-primary hover:text-white transition-all uppercase tracking-tighter"
                                                    >
                                                        下載結果
                                                    </a>

                                                    {/* 複製數據按鈕：統一格式 */}
                                                    <button 
                                                        onClick={() => {
                                                            const meta = JSON.parse(t.metadata_json);
                                                            meta.manual_image_id = t.source_image_id; // 確保使用正確的欄位名稱
                                                            navigator.clipboard.writeText(JSON.stringify(meta, null, 2)); 
                                                            alert("Metadata 已包含實體 ID，複製成功");
                                                        }} 
                                                        className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-gray-200 hover:text-gray-700 transition-all uppercase tracking-tighter"
                                                    >
                                                        複製數據
                                                    </button>
                                                </div>
                                            ) : t.status === 'failed' ? (
                                                <span className="text-red-400 text-[10px] font-bold italic uppercase">{t.error_message || 'FAILED'}</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" />
                                                    <span className="text-orange-400 text-[10px] font-bold italic uppercase tracking-widest">Processing...</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}