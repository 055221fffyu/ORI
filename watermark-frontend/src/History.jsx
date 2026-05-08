import { useState, useEffect } from 'react'
import api from './api'

export default function History() {
    const [tab, setTab] = useState('tasks') // tasks, verifies, images
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
        const endpoint = tab === 'tasks' ? '/embed/' : tab === 'verifies' ? '/verify/' : '/images/'
        const res = await api.get(endpoint)
        setData(res.data)
        } catch (err) {
        console.error("抓取歷史失敗", err)
        } finally {
        setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [tab])

    return (
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
            <div>
            <h2 className="text-2xl font-black mb-2 dark:text-white">查詢歷史</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Audit Logs & Records</p>
            </div>
            
            {/* 切換標籤 */}
            <div className="flex bg-gray-200/50 p-1 rounded-xl">
            {[
                { id: 'tasks', label: '任務紀錄' },
                { id: 'verifies', label: '驗證日誌' },
                { id: 'images', label: '原始圖片' }
            ].map(t => (
                <button 
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                {t.label}
                </button>
            ))}
            </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-gray-100">
            {loading ? (
            <div className="p-20 text-center text-gray-400 font-bold animate-pulse">載入歷史紀錄中...</div>
            ) : (
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-400 font-black uppercase text-[10px] tracking-widest">
                    <th className="p-6">時間</th>
                    <th className="p-6">項目詳情</th>
                    <th className="p-6">狀態 / 結果</th>
                    <th className="p-6 text-right">操作</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-6 text-xs text-gray-400 font-mono">
                        {(() => {
                            // 1. 處理字串：將空格換成 T，並在結尾加上 Z，告訴瀏覽器這是 UTC 時間
                            const utcStr = item.created_at.replace(' ', 'T') + 'Z';
                            const date = new Date(utcStr);
                            
                            // 2. 使用 toLocaleString 自動轉換為台灣時區
                            return date.toLocaleString('zh-TW', {
                                timeZone: 'Asia/Taipei',
                                hour12: false,
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });
                        })()}
                    </td>
                    
                    <td className="p-6">
                        {tab === 'tasks' && (
                        <div>
                            <p className="font-bold text-gray-800">Secret: {item.stegastamp_secret}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">{item.id}</p>
                        </div>
                        )}
                        {tab === 'verifies' && (
                        <div>
                            <p className="font-bold text-gray-800">驗證準確度: {item.editguard_accuracy}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {item.id}</p>
                        </div>
                        )}
                        {tab === 'images' && (
                        <div className="flex items-center gap-3">
                            <img src={item.blob_url} className="w-10 h-10 rounded-lg object-cover" />
                            <p className="font-bold text-gray-800 truncate max-w-[150px]">{item.original_filename}</p>
                        </div>
                        )}
                    </td>

                    <td className="p-6">
                        {tab === 'tasks' && (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${item.status === 'done' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            {item.status}
                        </span>
                        )}
                        {tab === 'verifies' && (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${item.overall_pass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {item.overall_pass ? 'PASS' : 'FAIL'}
                        </span>
                        )}
                        {tab === 'images' && <span className="text-gray-400 text-xs">{(item.file_size / 1024).toFixed(1)} KB</span>}
                    </td>

                    <td className="p-6 text-right">
                        {(tab === 'tasks' && item.result_image_url) && (
                        <a href={item.result_image_url} target="_blank" className="text-primary font-black text-xs hover:underline">下載結果</a>
                        )}
                        {tab === 'verifies' && (
                        <button onClick={() => alert(JSON.stringify(item.summary, null, 2))} className="text-primary font-black text-xs hover:underline">查看詳情</button>
                        )}
                        {tab === 'images' && (
                        <a href={item.blob_url} target="_blank" className="text-primary font-black text-xs hover:underline">查看原圖</a>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            )}
            
            {!loading && data.length === 0 && (
            <div className="p-20 text-center text-gray-300 font-bold italic">尚無任何歷史紀錄</div>
            )}
        </div>
        </div>
    )
}