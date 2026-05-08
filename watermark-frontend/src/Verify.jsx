import { useState } from 'react'
import api from './api'

export default function Verify() {
    const [metadata, setMetadata] = useState('')
    const [file, setFile] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleVerify = async (e) => {
        e.preventDefault()
        if (!metadata) return alert("請貼上 Metadata JSON")
        setLoading(true)
        
        try {
            // 使用 FormData 才能傳送實體檔案
            const formData = new FormData();
            formData.append('metadata_json', metadata);
            if (file) {
                formData.append('file', file);
            }

            const res = await api.post('/verify/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // 強制指定類型
            });
            setResult(res.data); 
        } catch (err) {
            // 這裡會顯示「找不到匹配圖片」的具體提示
            alert(err.response?.data?.detail || "驗證失敗");
        } finally {
            setLoading(false);
        }
    }

    const summaryObj = result ? (
        typeof result.summary === 'string' 
        ? JSON.parse(result.summary) 
        : result.summary
    ) : null;

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-black mb-6 dark:text-white">雙重驗證中心</h2>
            <form onSubmit={handleVerify} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm transition-colors">
                <div>
                    <label className="block text-sm font-bold mb-3 dark:text-gray-300">1. 貼上分析用的 Metadata JSON</label>
                    <textarea 
                        className="w-full h-40 border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 font-mono text-xs dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                        value={metadata}
                        onChange={(e) => setMetadata(e.target.value)}
                        placeholder='{"stegastamp_secret": "..."}'
                    />
                </div>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-gray-400">
                        {file ? <span className="text-primary font-bold">已選取: {file.name}</span> : "點擊或拖放要驗證的圖片"}
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black hover:opacity-90 disabled:bg-gray-400 transition shadow-lg shadow-primary/20"
                >
                    {loading ? "深度分析中..." : "開始執行驗證程序"}
                </button>
            </form>

            {/* 數位竄改取證報告區域 */}
            {result && summaryObj && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl shadow-sm">
                        <h4 className="text-gray-400 text-[10px] font-bold mb-2">EditGuard 狀態</h4>
                        <p className={`text-2xl font-black ${parseFloat(result.editguard_accuracy) > 95 ? 'text-green-500' : 'text-red-500'}`}>
                            {parseFloat(result.editguard_accuracy) > 95 ? "未發現竄改" : "警告：發現竄改"}
                        </p>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl shadow-sm flex flex-col items-center justify-center">
                        <h4 className="text-gray-400 text-[10px] font-bold mb-2">版權判定</h4>
                        {/* 字體加大，同步 EditGuard 樣式 */}
                        <p className={`text-2xl font-black ${result.overall_pass ? 'text-green-500' : 'text-red-500'}`}>
                            {result.overall_pass ? "身分符合" : "身分不符"}
                        </p>
                    </div>

                    {/* 只有當準確度掉下來且有圖時才顯示取證報告 */}
                    {result.mask_url && parseFloat(result.editguard_accuracy) <= 95 && (
                        <div className="mt-8 p-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl shadow-sm md:col-span-2">
                            <h4 className="text-gray-400 text-[10px] font-bold mb-4 text-center uppercase tracking-widest">⚠️ 數位竄改取證報告</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-2">1. 被分析的圖片 (The Suspect)</p>
                                    <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-1 bg-gray-50 dark:bg-gray-900">
                                        <img src={file ? URL.createObjectURL(file) : result.image_url} className="w-full h-auto rounded-lg" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-2">2. AI 竄改定位 (Tamper Mask)</p>
                                    <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-1 bg-black">
                                        <img src={result.mask_url} className="w-full h-auto rounded-lg" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-red-500 mt-4 text-center font-medium">偵測到局部像素異常。上圖黑色區域代表吻合，白色色塊代表 AI 判定的可疑竄改位置。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}